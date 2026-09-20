import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CorrectionStatus, LeaveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user.interface';
import { Role } from '../common/types/role.enum';
import { RequestContext } from '../common/decorators/request-context.decorator';
import { countWorkingDays, isWorkingDay, WorkCalendar } from '../leave/working-days';
import { addDays, localDate, zonedToInstant } from './timezone';
import { ClockDto, CreateCorrectionDto, ListAttendanceDto, ListCorrectionsDto, SummaryQueryDto } from './dto/attendance.dto';

/** A session still open after this long is treated as forgotten: it must be fixed with a correction. */
const STALE_OPEN_HOURS = 20;
/** Corrections may be requested for the last N days. */
const CORRECTION_WINDOW_DAYS = 31;
const MAX_SHIFT_HOURS = 20;
const MAX_RANGE_DAYS = 366;
const MAX_SUMMARY_DAYS = 93;

const isPeopleOps = (a: AuthUser) => a.role === Role.ADMIN || a.role === Role.HR;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const HOUR_MS = 3600_000;

const ATT_SELECT = {
  id: true,
  date: true,
  clockIn: true,
  clockOut: true,
  source: true,
  note: true,
  employee: { select: { id: true, employeeId: true, user: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.AttendanceSelect;
type AttRow = Prisma.AttendanceGetPayload<{ select: typeof ATT_SELECT }>;

const attView = (a: AttRow) => ({
  id: a.id,
  employee: { id: a.employee.id, employeeId: a.employee.employeeId, name: `${a.employee.user.firstName} ${a.employee.user.lastName}` },
  date: iso(a.date),
  clockIn: a.clockIn,
  clockOut: a.clockOut,
  workedMinutes: a.clockOut ? Math.round((a.clockOut.getTime() - a.clockIn.getTime()) / 60000) : null,
  open: a.clockOut === null,
  source: a.source,
  note: a.note,
});

const CORR_SELECT = {
  id: true,
  date: true,
  clockIn: true,
  clockOut: true,
  reason: true,
  status: true,
  rejectionReason: true,
  decidedAt: true,
  createdAt: true,
  employee: { select: { id: true, employeeId: true, managerId: true, userId: true, user: { select: { firstName: true, lastName: true } } } },
} satisfies Prisma.AttendanceCorrectionSelect;
type CorrRow = Prisma.AttendanceCorrectionGetPayload<{ select: typeof CORR_SELECT }>;

const corrView = (c: CorrRow) => ({
  id: c.id,
  employee: { id: c.employee.id, employeeId: c.employee.employeeId, name: `${c.employee.user.firstName} ${c.employee.user.lastName}` },
  date: iso(c.date),
  clockIn: c.clockIn,
  clockOut: c.clockOut,
  reason: c.reason,
  status: c.status,
  rejectionReason: c.rejectionReason,
  decidedAt: c.decidedAt,
  createdAt: c.createdAt,
});

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------------ clocking

  async clockIn(actor: AuthUser, dto: ClockDto, ctx: RequestContext) {
    const employee = await this.ownEmployee(actor);
    if (employee.terminationDate && employee.terminationDate <= new Date()) throw new ForbiddenException('Your employment has ended');
    const { timezone } = await this.tenantSettings(actor.tenantId);

    const now = new Date();
    const date = localDate(now, timezone);

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employee.id}))`;

        const open = await tx.attendance.findFirst({ where: { employeeId: employee.id, clockOut: null, clockIn: { gt: new Date(now.getTime() - STALE_OPEN_HOURS * HOUR_MS) } }, select: { clockIn: true } });
        if (open) throw new ConflictException('You are already clocked in. Clock out first.');

        const today = await tx.attendance.findUnique({ where: { employeeId_date: { employeeId: employee.id, date: new Date(date) } }, select: { clockOut: true } });
        if (today) {
          throw new ConflictException(
            today.clockOut ? 'Attendance is already recorded for today. If it is wrong, submit a correction.' : 'You have an unfinished session for today. Submit a correction to close it.',
          );
        }
        return tx.attendance.create({ data: { employeeId: employee.id, tenantId: actor.tenantId, date: new Date(date), clockIn: now, note: dto.note?.trim() || undefined }, select: ATT_SELECT });
      });
      await this.audit.record({ action: 'attendance.clock_in', tenantId: actor.tenantId, actorId: actor.id, entityType: 'attendance', entityId: row.id, metadata: { date }, ...ctx });
      return attView(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Attendance is already recorded for today');
      }
      throw error;
    }
  }

  async clockOut(actor: AuthUser, dto: ClockDto, ctx: RequestContext) {
    const employee = await this.ownEmployee(actor);
    const now = new Date();

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employee.id}))`;
      const open = await tx.attendance.findFirst({ where: { employeeId: employee.id, clockOut: null }, orderBy: { clockIn: 'desc' }, select: { id: true, clockIn: true, note: true } });
      if (!open) throw new ConflictException('You are not clocked in.');
      if (now.getTime() - open.clockIn.getTime() > STALE_OPEN_HOURS * HOUR_MS) {
        throw new ConflictException(`Your session started more than ${STALE_OPEN_HOURS} hours ago. Submit a correction with the right times.`);
      }
      return tx.attendance.update({
        where: { id: open.id },
        data: { clockOut: now, note: dto.note?.trim() ? dto.note.trim() : open.note },
        select: ATT_SELECT,
      });
    });
    await this.audit.record({ action: 'attendance.clock_out', tenantId: actor.tenantId, actorId: actor.id, entityType: 'attendance', entityId: row.id, ...ctx });
    return attView(row);
  }

  async today(actor: AuthUser) {
    const employee = await this.ownEmployee(actor);
    const { timezone } = await this.tenantSettings(actor.tenantId);
    const now = new Date();
    const date = localDate(now, timezone);
    const open = await this.prisma.attendance.findFirst({ where: { employeeId: employee.id, clockOut: null }, orderBy: { clockIn: 'desc' }, select: ATT_SELECT });
    const record = open ?? (await this.prisma.attendance.findUnique({ where: { employeeId_date: { employeeId: employee.id, date: new Date(date) } }, select: ATT_SELECT }));
    const stale = !!open && now.getTime() - open.clockIn.getTime() > STALE_OPEN_HOURS * HOUR_MS;
    return { date, timezone, record: record ? attView(record) : null, clockedIn: !!open && !stale, stale };
  }

  // ------------------------------------------------------------ records

  async list(actor: AuthUser, query: ListAttendanceDto) {
    const { timezone } = await this.tenantSettings(actor.tenantId);
    const to = query.to ?? localDate(new Date(), timezone);
    const from = query.from ?? addDays(to, -30);
    if (to < from) throw new BadRequestException('"to" cannot be before "from"');
    if (this.daysBetween(from, to) > MAX_RANGE_DAYS) throw new BadRequestException(`The date range cannot exceed ${MAX_RANGE_DAYS} days`);

    const where: Prisma.AttendanceWhereInput = { tenantId: actor.tenantId, date: { gte: new Date(from), lte: new Date(to) } };
    Object.assign(where, await this.scopeFilter(actor, query.scope ?? 'mine'));

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({ where, select: ATT_SELECT, orderBy: [{ date: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.attendance.count({ where }),
    ]);
    return { items: rows.map(attView), total, page, pageSize, from, to };
  }

  /** Days present, on approved leave and absent for one employee, from the organization's own calendar. */
  async summary(actor: AuthUser, query: SummaryQueryDto) {
    const { from, to } = query;
    if (to < from) throw new BadRequestException('"to" cannot be before "from"');
    if (this.daysBetween(from, to) > MAX_SUMMARY_DAYS) throw new BadRequestException(`The summary range cannot exceed ${MAX_SUMMARY_DAYS} days`);

    const employeeId = await this.resolveTarget(actor, query.employeeId);
    const { timezone, weekendDays } = await this.tenantSettings(actor.tenantId);
    const today = localDate(new Date(), timezone);

    const [holidayRows, records, leaves] = await Promise.all([
      this.prisma.holiday.findMany({ where: { tenantId: actor.tenantId, date: { gte: new Date(from), lte: new Date(to) } }, select: { date: true } }),
      this.prisma.attendance.findMany({ where: { employeeId, date: { gte: new Date(from), lte: new Date(to) } }, select: { date: true, clockIn: true, clockOut: true } }),
      this.prisma.leave.findMany({ where: { employeeId, status: LeaveStatus.APPROVED, startDate: { lte: new Date(to) }, endDate: { gte: new Date(from) } }, select: { startDate: true, endDate: true } }),
    ]);
    const calendar: WorkCalendar = { weekendDays, holidays: new Set(holidayRows.map((h) => iso(h.date))) };

    const attended = new Set(records.map((r) => iso(r.date)));
    const onLeave = new Set<string>();
    for (const l of leaves) {
      for (let d = iso(l.startDate) > from ? iso(l.startDate) : from; d <= (iso(l.endDate) < to ? iso(l.endDate) : to); d = addDays(d, 1)) onLeave.add(d);
    }

    let workingDays = 0;
    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let restDayWork = 0;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const working = isWorkingDay(d, calendar);
      if (working) workingDays++;
      const present = attended.has(d);
      if (!working) {
        if (present) restDayWork++;
        continue;
      }
      if (present) presentDays++;
      else if (onLeave.has(d)) leaveDays++;
      else if (d < today) absentDays++; // only days that are over can be absent
    }

    const totalMinutes = records.reduce((sum, r) => sum + (r.clockOut ? Math.round((r.clockOut.getTime() - r.clockIn.getTime()) / 60000) : 0), 0);
    return {
      employeeId,
      from,
      to,
      timezone,
      workingDays,
      presentDays,
      leaveDays,
      absentDays,
      restDayWork,
      openSessions: records.filter((r) => !r.clockOut).length,
      totalMinutes,
    };
  }

  // ------------------------------------------------------------ corrections

  async createCorrection(actor: AuthUser, dto: CreateCorrectionDto, ctx: RequestContext) {
    const employee = await this.ownEmployee(actor);
    const { timezone } = await this.tenantSettings(actor.tenantId);
    const today = localDate(new Date(), timezone);

    if (dto.date > today) throw new BadRequestException('You cannot correct a day that has not happened yet');
    if (dto.date < addDays(today, -CORRECTION_WINDOW_DAYS)) throw new BadRequestException(`Corrections can only be requested for the last ${CORRECTION_WINDOW_DAYS} days. Ask HR for older dates.`);

    const clockIn = zonedToInstant(dto.date, dto.clockInTime, timezone);
    const outDate = dto.clockOutTime > dto.clockInTime ? dto.date : addDays(dto.date, 1); // not later than the start: overnight
    const clockOut = zonedToInstant(outDate, dto.clockOutTime, timezone);
    if (clockOut <= clockIn) throw new BadRequestException('The end time must be after the start time');
    if (clockOut.getTime() - clockIn.getTime() > MAX_SHIFT_HOURS * HOUR_MS) throw new BadRequestException(`A single day cannot exceed ${MAX_SHIFT_HOURS} hours`);
    if (clockOut > new Date()) throw new BadRequestException('The end time is in the future');

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${employee.id}))`;
      const pending = await tx.attendanceCorrection.findFirst({ where: { employeeId: employee.id, date: new Date(dto.date), status: CorrectionStatus.PENDING }, select: { id: true } });
      if (pending) throw new ConflictException('You already have a pending correction for this day');
      return tx.attendanceCorrection.create({
        data: { tenantId: actor.tenantId, employeeId: employee.id, date: new Date(dto.date), clockIn, clockOut, reason: dto.reason.trim() },
        select: CORR_SELECT,
      });
    });
    await this.audit.record({ action: 'attendance.correction.request', tenantId: actor.tenantId, actorId: actor.id, entityType: 'attendance_correction', entityId: row.id, metadata: { date: dto.date }, ...ctx });
    return corrView(row);
  }

  async listCorrections(actor: AuthUser, query: ListCorrectionsDto) {
    const where: Prisma.AttendanceCorrectionWhereInput = { tenantId: actor.tenantId };
    Object.assign(where, await this.scopeFilter(actor, query.scope ?? 'mine'));
    if (query.status) where.status = query.status;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.attendanceCorrection.findMany({ where, select: CORR_SELECT, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.attendanceCorrection.count({ where }),
    ]);
    return { items: rows.map(corrView), total, page, pageSize };
  }

  async decideCorrection(id: string, action: 'approve' | 'reject', reason: string | undefined, actor: AuthUser, ctx: RequestContext) {
    if (action === 'reject' && !reason?.trim()) throw new BadRequestException('A reason is required when rejecting a correction');
    const correction = await this.prisma.attendanceCorrection.findFirst({ where: { id, tenantId: actor.tenantId }, select: CORR_SELECT });
    if (!correction) throw new NotFoundException('Correction not found');

    const me = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: { id: true } });
    if (me && me.id === correction.employee.id) throw new ForbiddenException('You cannot approve or reject your own correction');
    if (!isPeopleOps(actor) && !(me && correction.employee.managerId === me.id)) {
      throw new ForbiddenException("Only the employee's manager, HR or an administrator can decide this correction");
    }

    const status = action === 'approve' ? CorrectionStatus.APPROVED : CorrectionStatus.REJECTED;
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.attendanceCorrection.updateMany({
        where: { id, tenantId: actor.tenantId, status: CorrectionStatus.PENDING },
        data: { status, decidedById: actor.id, decidedAt: new Date(), rejectionReason: action === 'reject' ? reason!.trim() : null },
      });
      if (count === 0) throw new ConflictException('This correction has already been decided or cancelled');
      if (action === 'approve') {
        await tx.attendance.upsert({
          where: { employeeId_date: { employeeId: correction.employee.id, date: correction.date } },
          update: { clockIn: correction.clockIn, clockOut: correction.clockOut, source: 'CORRECTION' },
          create: { employeeId: correction.employee.id, tenantId: actor.tenantId, date: correction.date, clockIn: correction.clockIn, clockOut: correction.clockOut, source: 'CORRECTION' },
        });
      }
    });
    await this.audit.record({ action: `attendance.correction.${action}`, tenantId: actor.tenantId, actorId: actor.id, entityType: 'attendance_correction', entityId: id, metadata: { date: iso(correction.date), employeeId: correction.employee.employeeId }, ...ctx });
    return corrView(await this.prisma.attendanceCorrection.findUniqueOrThrow({ where: { id }, select: CORR_SELECT }));
  }

  async cancelCorrection(id: string, actor: AuthUser, ctx: RequestContext) {
    const correction = await this.prisma.attendanceCorrection.findFirst({ where: { id, tenantId: actor.tenantId }, select: CORR_SELECT });
    if (!correction) throw new NotFoundException('Correction not found');
    if (correction.employee.userId !== actor.id && !isPeopleOps(actor)) throw new ForbiddenException('Only the employee, HR or an administrator can cancel this correction');
    const { count } = await this.prisma.attendanceCorrection.updateMany({ where: { id, tenantId: actor.tenantId, status: CorrectionStatus.PENDING }, data: { status: CorrectionStatus.CANCELLED, decidedAt: new Date() } });
    if (count === 0) throw new ConflictException('Only a pending correction can be cancelled');
    await this.audit.record({ action: 'attendance.correction.cancel', tenantId: actor.tenantId, actorId: actor.id, entityType: 'attendance_correction', entityId: id, ...ctx });
    return corrView(await this.prisma.attendanceCorrection.findUniqueOrThrow({ where: { id }, select: CORR_SELECT }));
  }

  // ------------------------------------------------------------ helpers

  private async ownEmployee(actor: AuthUser) {
    const employee = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: { id: true, terminationDate: true } });
    if (!employee) throw new ForbiddenException('You do not have an employee record, so you cannot record or view attendance');
    return employee;
  }

  private tenantSettings(tenantId: string) {
    return this.prisma.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { defaultTimezone: true, weekendDays: true } }).then((t) => ({ timezone: t.defaultTimezone, weekendDays: t.weekendDays }));
  }

  /** The filter that narrows a query to the caller's own, their reports', or everyone's records. */
  private async scopeFilter(actor: AuthUser, scope: 'mine' | 'team' | 'all'): Promise<{ employeeId?: string; employee?: { managerId: string } }> {
    if (scope === 'all') {
      if (!isPeopleOps(actor)) throw new ForbiddenException('Only HR and administrators can view everyone');
      return {};
    }
    const me = await this.ownEmployee(actor);
    if (scope === 'team') {
      if (actor.role === Role.EMPLOYEE) throw new ForbiddenException('Only managers can view team records');
      return { employee: { managerId: me.id } };
    }
    return { employeeId: me.id };
  }

  private async resolveTarget(actor: AuthUser, employeeId?: string): Promise<string> {
    if (!employeeId) return (await this.ownEmployee(actor)).id;
    const target = await this.prisma.employee.findFirst({ where: { id: employeeId, tenantId: actor.tenantId }, select: { id: true, managerId: true, userId: true } });
    if (!target) throw new NotFoundException('Employee not found');
    const me = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: { id: true } });
    if (!(isPeopleOps(actor) || target.userId === actor.id || (me && target.managerId === me.id))) throw new ForbiddenException("You cannot view this employee's attendance");
    return target.id;
  }

  private daysBetween(from: string, to: string) {
    return countWorkingDays(from, to, { weekendDays: [], holidays: new Set() });
  }
}
