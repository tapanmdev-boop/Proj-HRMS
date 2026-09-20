import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveStatus, LeaveType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user.interface';
import { Role } from '../common/types/role.enum';
import { RequestContext } from '../common/decorators/request-context.decorator';
import { BalanceQueryDto, CreateLeaveDto, ListLeaveDto } from './dto/leave.dto';
import { countWorkingDays, rangesOverlap, toIsoDate, WorkCalendar, yearOf } from './working-days';

const isPeopleOps = (a: AuthUser) => a.role === Role.ADMIN || a.role === Role.HR;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayIso = () => toIsoDate(Date.now());

const LEAVE_SELECT = {
  id: true,
  leaveType: true,
  startDate: true,
  endDate: true,
  days: true,
  reason: true,
  status: true,
  rejectionReason: true,
  decidedAt: true,
  approvedById: true,
  createdAt: true,
  employee: { select: { id: true, employeeId: true, managerId: true, user: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.LeaveSelect;

type LeaveRow = Prisma.LeaveGetPayload<{ select: typeof LEAVE_SELECT }>;

const view = (l: LeaveRow) => ({
  id: l.id,
  employee: { id: l.employee.id, employeeId: l.employee.employeeId, name: `${l.employee.user.firstName} ${l.employee.user.lastName}` },
  leaveType: l.leaveType,
  startDate: iso(l.startDate),
  endDate: iso(l.endDate),
  days: l.days.toString(),
  reason: l.reason,
  status: l.status,
  rejectionReason: l.rejectionReason,
  decidedAt: l.decidedAt,
  createdAt: l.createdAt,
});

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------------ requests

  async create(actor: AuthUser, dto: CreateLeaveDto, ctx: RequestContext) {
    const employee = await this.ownEmployee(actor);
    if (employee.terminationDate && employee.terminationDate <= new Date()) {
      throw new ForbiddenException('Your employment has ended');
    }
    if (dto.endDate < dto.startDate) {
      throw new BadRequestException('The end date cannot be before the start date');
    }
    if (yearOf(dto.startDate) !== yearOf(dto.endDate)) {
      throw new BadRequestException('A request cannot span two calendar years. Submit one request per year.');
    }

    const calendar = await this.calendar(actor.tenantId, dto.startDate, dto.endDate);
    const days = countWorkingDays(dto.startDate, dto.endDate, calendar);
    if (days === 0) {
      throw new BadRequestException('The selected dates contain no working days (weekends and holidays are excluded)');
    }

    const row = await this.prisma.$transaction(async (tx) => {
      // Serialize concurrent requests from the same employee so overlap and balance checks cannot race.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employee.id}))`;

      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      const overlapping = await tx.leave.findFirst({
        where: { employeeId: employee.id, status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] }, startDate: { lte: end }, endDate: { gte: start } },
        select: { startDate: true, endDate: true },
      });
      if (overlapping) {
        throw new ConflictException(`You already have leave from ${iso(overlapping.startDate)} to ${iso(overlapping.endDate)} that overlaps these dates`);
      }

      const policy = await tx.leavePolicy.findUnique({ where: { tenantId_leaveType: { tenantId: actor.tenantId, leaveType: dto.leaveType } } });
      if (policy) {
        const year = yearOf(dto.startDate);
        const used = await this.sumDays(tx, employee.id, dto.leaveType, year, [LeaveStatus.PENDING, LeaveStatus.APPROVED]);
        const remaining = policy.daysPerYear.minus(used);
        if (new Prisma.Decimal(days).gt(remaining)) {
          throw new BadRequestException(`Not enough ${dto.leaveType.toLowerCase()} leave: ${remaining.toString()} day(s) remaining in ${year}, ${days} requested`);
        }
      }

      return tx.leave.create({
        data: { employeeId: employee.id, tenantId: actor.tenantId, leaveType: dto.leaveType, startDate: start, endDate: end, reason: dto.reason.trim(), days },
        select: LEAVE_SELECT,
      });
    });

    await this.audit.record({ action: 'leave.request', tenantId: actor.tenantId, actorId: actor.id, entityType: 'leave', entityId: row.id, metadata: { leaveType: dto.leaveType, days, start: dto.startDate, end: dto.endDate }, ...ctx });
    return view(row);
  }

  async list(actor: AuthUser, query: ListLeaveDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const scope = query.scope ?? 'mine';
    const where: Prisma.LeaveWhereInput = { tenantId: actor.tenantId };

    if (scope === 'all') {
      if (!isPeopleOps(actor)) throw new ForbiddenException('Only HR and administrators can view all leave');
    } else {
      const me = await this.ownEmployee(actor);
      if (scope === 'team') {
        if (actor.role === Role.EMPLOYEE) throw new ForbiddenException('Only managers can view team leave');
        where.employee = { managerId: me.id };
      } else {
        where.employeeId = me.id;
      }
    }
    if (query.status) where.status = query.status;
    if (query.year) where.startDate = { gte: new Date(`${query.year}-01-01`), lte: new Date(`${query.year}-12-31`) };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.leave.findMany({ where, select: LEAVE_SELECT, orderBy: [{ startDate: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.leave.count({ where }),
    ]);
    return { items: rows.map(view), total, page, pageSize };
  }

  async decide(id: string, action: 'approve' | 'reject', reason: string | undefined, actor: AuthUser, ctx: RequestContext) {
    if (action === 'reject' && !reason?.trim()) {
      throw new BadRequestException('A reason is required when rejecting leave');
    }
    const leave = await this.prisma.leave.findFirst({ where: { id, tenantId: actor.tenantId }, select: LEAVE_SELECT });
    if (!leave) throw new NotFoundException('Leave request not found');

    const me = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: { id: true } });
    if (me && me.id === leave.employee.id) {
      throw new ForbiddenException('You cannot approve or reject your own leave');
    }
    const isManager = !!me && leave.employee.managerId === me.id;
    if (!isPeopleOps(actor) && !isManager) {
      throw new ForbiddenException('Only the employee\'s manager, HR or an administrator can decide this request');
    }

    const status = action === 'approve' ? LeaveStatus.APPROVED : LeaveStatus.REJECTED;
    // Claim atomically so two approvers cannot both decide the same request.
    const { count } = await this.prisma.leave.updateMany({
      where: { id, tenantId: actor.tenantId, status: LeaveStatus.PENDING },
      data: { status, approvedById: actor.id, decidedAt: new Date(), rejectionReason: action === 'reject' ? reason!.trim() : null },
    });
    if (count === 0) {
      throw new ConflictException('This request has already been decided or cancelled');
    }
    await this.audit.record({ action: `leave.${action}`, tenantId: actor.tenantId, actorId: actor.id, entityType: 'leave', entityId: id, metadata: { employeeId: leave.employee.employeeId, days: leave.days.toString() }, ...ctx });
    return view((await this.prisma.leave.findUniqueOrThrow({ where: { id }, select: LEAVE_SELECT })));
  }

  async cancel(id: string, actor: AuthUser, ctx: RequestContext) {
    const leave = await this.prisma.leave.findFirst({ where: { id, tenantId: actor.tenantId }, select: { ...LEAVE_SELECT, employee: { select: { ...LEAVE_SELECT.employee.select, userId: true } } } });
    if (!leave) throw new NotFoundException('Leave request not found');

    const isOwner = leave.employee.userId === actor.id;
    if (!isOwner && !isPeopleOps(actor)) {
      throw new ForbiddenException('Only the employee, HR or an administrator can cancel this request');
    }
    // Employees may withdraw a pending request, or approved leave that has not started; HR/Admin may cancel either at any time.
    const cancellable =
      leave.status === LeaveStatus.PENDING ||
      (leave.status === LeaveStatus.APPROVED && (isPeopleOps(actor) || iso(leave.startDate) > todayIso()));
    if (!cancellable) {
      throw new ConflictException(leave.status === LeaveStatus.APPROVED ? 'Approved leave that has already started can only be cancelled by HR' : `A ${leave.status.toLowerCase()} request cannot be cancelled`);
    }

    const { count } = await this.prisma.leave.updateMany({
      where: { id, tenantId: actor.tenantId, status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] } },
      data: { status: LeaveStatus.CANCELLED, decidedAt: new Date() },
    });
    if (count === 0) throw new ConflictException('This request can no longer be cancelled');
    await this.audit.record({ action: 'leave.cancel', tenantId: actor.tenantId, actorId: actor.id, entityType: 'leave', entityId: id, metadata: { previousStatus: leave.status }, ...ctx });
    return view(await this.prisma.leave.findUniqueOrThrow({ where: { id }, select: LEAVE_SELECT }));
  }

  // ------------------------------------------------------------------ balances

  async balances(actor: AuthUser, query: BalanceQueryDto) {
    const year = query.year ?? Number(todayIso().slice(0, 4));
    let employeeId: string;
    if (query.employeeId) {
      const target = await this.prisma.employee.findFirst({ where: { id: query.employeeId, tenantId: actor.tenantId }, select: { id: true, managerId: true, userId: true } });
      if (!target) throw new NotFoundException('Employee not found');
      const me = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: { id: true } });
      const allowed = isPeopleOps(actor) || target.userId === actor.id || (!!me && target.managerId === me.id);
      if (!allowed) throw new ForbiddenException('You cannot view this employee\'s balances');
      employeeId = target.id;
    } else {
      employeeId = (await this.ownEmployee(actor)).id;
    }

    const policies = await this.prisma.leavePolicy.findMany({ where: { tenantId: actor.tenantId } });
    const byType = new Map(policies.map((p) => [p.leaveType, p.daysPerYear]));
    const grouped = await this.prisma.leave.groupBy({
      by: ['leaveType', 'status'],
      where: { employeeId, tenantId: actor.tenantId, status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] }, startDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
      _sum: { days: true },
    });
    const sum = (type: LeaveType, status: LeaveStatus) => grouped.find((g) => g.leaveType === type && g.status === status)?._sum.days ?? new Prisma.Decimal(0);

    const items = Object.values(LeaveType).map((type) => {
      const entitlement = byType.get(type) ?? null;
      const used = sum(type, LeaveStatus.APPROVED);
      const pending = sum(type, LeaveStatus.PENDING);
      return {
        leaveType: type,
        entitlement: entitlement?.toString() ?? null, // null = not limited by a policy
        used: used.toString(),
        pending: pending.toString(),
        remaining: entitlement ? entitlement.minus(used).minus(pending).toString() : null,
      };
    });
    return { year, employeeId, items };
  }

  // ------------------------------------------------------------------ policies

  listPolicies(tenantId: string) {
    return this.prisma.leavePolicy
      .findMany({ where: { tenantId }, orderBy: { leaveType: 'asc' } })
      .then((rows) => rows.map((p) => ({ leaveType: p.leaveType, daysPerYear: p.daysPerYear.toString() })));
  }

  async setPolicy(type: LeaveType, daysPerYear: string, actor: AuthUser, ctx: RequestContext) {
    if (new Prisma.Decimal(daysPerYear).gt(366)) throw new BadRequestException('daysPerYear cannot exceed 366');
    const row = await this.prisma.leavePolicy.upsert({
      where: { tenantId_leaveType: { tenantId: actor.tenantId, leaveType: type } },
      update: { daysPerYear },
      create: { tenantId: actor.tenantId, leaveType: type, daysPerYear },
    });
    await this.audit.record({ action: 'leave.policy.set', tenantId: actor.tenantId, actorId: actor.id, entityType: 'leave_policy', entityId: row.id, metadata: { leaveType: type, daysPerYear }, ...ctx });
    return { leaveType: row.leaveType, daysPerYear: row.daysPerYear.toString() };
  }

  async removePolicy(type: LeaveType, actor: AuthUser, ctx: RequestContext) {
    const { count } = await this.prisma.leavePolicy.deleteMany({ where: { tenantId: actor.tenantId, leaveType: type } });
    if (count === 0) throw new NotFoundException('No policy for this leave type');
    await this.audit.record({ action: 'leave.policy.remove', tenantId: actor.tenantId, actorId: actor.id, entityType: 'leave_policy', metadata: { leaveType: type }, ...ctx });
    return { leaveType: type, removed: true };
  }

  // ------------------------------------------------------------------ helpers

  private async ownEmployee(actor: AuthUser) {
    const employee = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: { id: true, terminationDate: true } });
    if (!employee) throw new ForbiddenException('You do not have an employee record, so you cannot request or view leave');
    return employee;
  }

  private async calendar(tenantId: string, from: string, to: string): Promise<WorkCalendar> {
    const [tenant, holidays] = await Promise.all([
      this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { weekendDays: true } }),
      this.prisma.holiday.findMany({ where: { tenantId, date: { gte: new Date(from), lte: new Date(to) } }, select: { date: true } }),
    ]);
    return { weekendDays: tenant.weekendDays, holidays: new Set(holidays.map((h) => iso(h.date))) };
  }

  private async sumDays(tx: Prisma.TransactionClient, employeeId: string, type: LeaveType, year: number, statuses: LeaveStatus[]) {
    const agg = await tx.leave.aggregate({
      where: { employeeId, leaveType: type, status: { in: statuses }, startDate: { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) } },
      _sum: { days: true },
    });
    return agg._sum.days ?? new Prisma.Decimal(0);
  }
}
