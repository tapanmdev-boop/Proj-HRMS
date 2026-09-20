import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { AuthUser } from '../common/types/auth-user.interface';
import { Role } from '../common/types/role.enum';
import { RequestContext } from '../common/decorators/request-context.decorator';

/** Directory fields every signed-in user may see. */
const BASE_SELECT = {
  id: true,
  employeeId: true,
  userId: true,
  position: true,
  joinDate: true,
  terminationDate: true,
  departmentId: true,
  managerId: true,
  department: { select: { id: true, name: true } },
  user: { select: { email: true, firstName: true, lastName: true, role: true, isActive: true } },
} satisfies Prisma.EmployeeSelect;

/** Personal, financial and identity data: visible only to Admin/HR and to the employee themself. */
const SENSITIVE_SELECT = {
  ...BASE_SELECT,
  dateOfBirth: true,
  gender: true,
  phoneNumber: true,
  address: true,
  emergencyContact: true,
  bankAccount: true,
  salary: true,
  currency: true,
  identifiers: true,
  allowances: true,
} satisfies Prisma.EmployeeSelect;

type SensitiveRow = Prisma.EmployeeGetPayload<{ select: typeof SENSITIVE_SELECT }>;

const isoDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
const isPeopleOps = (actor: AuthUser) => actor.role === Role.ADMIN || actor.role === Role.HR;

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly users: UsersService,
  ) {}

  async list(actor: AuthUser, query: ListEmployeesDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const sensitive = isPeopleOps(actor);
    const now = new Date();

    const where: Prisma.EmployeeWhereInput = { tenantId: actor.tenantId };
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.status === 'ACTIVE') where.OR = [{ terminationDate: null }, { terminationDate: { gt: now } }];
    if (query.status === 'TERMINATED') where.terminationDate = { lte: now };
    if (query.search) {
      const contains = { contains: query.search, mode: 'insensitive' as const };
      where.AND = [
        {
          OR: [
            { position: contains },
            { employeeId: contains },
            { user: { email: contains } },
            { user: { firstName: contains } },
            { user: { lastName: contains } },
          ],
        },
      ];
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        select: sensitive ? SENSITIVE_SELECT : BASE_SELECT,
        orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items: rows.map((row) => this.toView(row as SensitiveRow, sensitive)), total, page, pageSize };
  }

  async findOne(id: string, actor: AuthUser) {
    const row = await this.prisma.employee.findFirst({ where: { id, tenantId: actor.tenantId }, select: SENSITIVE_SELECT });
    if (!row) {
      throw new NotFoundException('Employee not found');
    }
    return this.toView(row, isPeopleOps(actor) || row.userId === actor.id);
  }

  async findMe(actor: AuthUser) {
    const row = await this.prisma.employee.findFirst({ where: { userId: actor.id, tenantId: actor.tenantId }, select: SENSITIVE_SELECT });
    if (!row) {
      throw new NotFoundException('You do not have an employee record');
    }
    return this.toView(row, true);
  }

  async create(dto: CreateEmployeeDto, actor: AuthUser, ctx: RequestContext) {
    const tenantId = actor.tenantId;
    if (dto.departmentId) await this.assertDepartment(tenantId, dto.departmentId);
    if (dto.managerId) await this.assertManager(tenantId, dto.managerId);

    const email = dto.email.trim().toLowerCase();
    if (await this.users.findByEmail(email, tenantId)) {
      throw new ConflictException('A user with this email already exists');
    }
    const password = await this.users.hashPassword(dto.password);

    // A generated id can collide with a concurrent request; retry with the next number.
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const row = await this.prisma.$transaction(async (tx) => {
          const employeeId = dto.employeeId ?? (await this.nextEmployeeId(tx, tenantId, attempt));
          const user = await tx.user.create({
            data: { email, password, firstName: dto.firstName.trim(), lastName: dto.lastName.trim(), role: dto.role ?? Role.EMPLOYEE, tenantId },
            select: { id: true },
          });
          return tx.employee.create({
            data: {
              employeeId,
              userId: user.id,
              tenantId,
              position: dto.position.trim(),
              departmentId: dto.departmentId,
              managerId: dto.managerId,
              joinDate: new Date(dto.joinDate),
              dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
              gender: dto.gender,
              phoneNumber: dto.phoneNumber,
              address: dto.address,
              emergencyContact: dto.emergencyContact,
              bankAccount: dto.bankAccount,
              salary: dto.salary,
              currency: dto.currency,
              identifiers: dto.identifiers as Prisma.InputJsonValue | undefined,
              allowances: dto.allowances as Prisma.InputJsonValue | undefined,
            },
            select: SENSITIVE_SELECT,
          });
        });
        await this.audit.record({ action: 'employee.create', tenantId, actorId: actor.id, entityType: 'employee', entityId: row.id, metadata: { employeeId: row.employeeId, position: row.position }, ...ctx });
        return this.toView(row, true);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          const target = String((error.meta as { target?: unknown })?.target ?? '');
          if (target.includes('email')) throw new ConflictException('A user with this email already exists');
          if (target.includes('employeeId') && dto.employeeId) throw new ConflictException('That employee id is already in use');
          if (target.includes('employeeId')) continue; // generated id collided: try the next one
        }
        throw error;
      }
    }
    throw new ConflictException('Could not allocate an employee id; please retry');
  }

  async update(id: string, dto: UpdateEmployeeDto, actor: AuthUser, ctx: RequestContext) {
    const tenantId = actor.tenantId;
    const existing = await this.prisma.employee.findFirst({ where: { id, tenantId }, select: { id: true, userId: true } });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }
    // `null` clears an optional relation; undefined leaves it unchanged.
    const departmentId = dto.departmentId as string | null | undefined;
    const managerId = dto.managerId as string | null | undefined;
    if (departmentId) await this.assertDepartment(tenantId, departmentId);
    if (managerId) await this.assertManager(tenantId, managerId, existing.id);

    const data: Prisma.EmployeeUncheckedUpdateInput = {
      employeeId: dto.employeeId,
      position: dto.position?.trim(),
      departmentId,
      managerId,
      joinDate: dto.joinDate ? new Date(dto.joinDate) : undefined,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      bankAccount: dto.bankAccount,
      salary: dto.salary,
      currency: dto.currency,
      identifiers: dto.identifiers as Prisma.InputJsonValue | undefined,
      allowances: dto.allowances as Prisma.InputJsonValue | undefined,
    };

    try {
      const row = await this.prisma.$transaction(async (tx) => {
        if (dto.firstName !== undefined || dto.lastName !== undefined) {
          await tx.user.update({
            where: { id: existing.userId },
            data: { firstName: dto.firstName?.trim(), lastName: dto.lastName?.trim() },
          });
        }
        return tx.employee.update({ where: { id: existing.id }, data, select: SENSITIVE_SELECT });
      });
      await this.audit.record({
        action: 'employee.update',
        tenantId,
        actorId: actor.id,
        entityType: 'employee',
        entityId: existing.id,
        metadata: { fields: Object.keys(dto) }, // field names only; values (salary, ids, bank) are never logged
        ...ctx,
      });
      return this.toView(row, true);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('That employee id is already in use');
      }
      throw error;
    }
  }

  /** Ends employment. History is retained; the login is disabled once the termination date is reached. */
  async terminate(id: string, dto: TerminateEmployeeDto, actor: AuthUser, ctx: RequestContext) {
    const existing = await this.prisma.employee.findFirst({ where: { id, tenantId: actor.tenantId }, select: { id: true, userId: true, joinDate: true } });
    if (!existing) {
      throw new NotFoundException('Employee not found');
    }
    if (existing.userId === actor.id) {
      throw new ForbiddenException('You cannot terminate your own employment record');
    }
    const terminationDate = new Date(dto.terminationDate);
    if (terminationDate < existing.joinDate) {
      throw new BadRequestException('The termination date cannot be before the join date');
    }
    const effectiveNow = terminationDate <= new Date();

    const row = await this.prisma.$transaction(async (tx) => {
      if (effectiveNow) {
        await tx.user.update({ where: { id: existing.userId }, data: { isActive: false } });
        await tx.refreshToken.updateMany({ where: { userId: existing.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      return tx.employee.update({ where: { id: existing.id }, data: { terminationDate }, select: SENSITIVE_SELECT });
    });
    await this.audit.record({ action: 'employee.terminate', tenantId: actor.tenantId, actorId: actor.id, entityType: 'employee', entityId: existing.id, metadata: { terminationDate: dto.terminationDate, accessRevoked: effectiveNow }, ...ctx });
    return this.toView(row, true);
  }

  // ---- helpers ----

  private toView(row: SensitiveRow, sensitive: boolean) {
    const now = new Date();
    const view = {
      id: row.id,
      employeeId: row.employeeId,
      userId: row.userId,
      email: row.user.email,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      role: row.user.role,
      position: row.position,
      department: row.department,
      departmentId: row.departmentId,
      managerId: row.managerId,
      joinDate: isoDate(row.joinDate),
      terminationDate: isoDate(row.terminationDate),
      status: row.terminationDate && row.terminationDate <= now ? 'TERMINATED' : 'ACTIVE',
    };
    if (!sensitive) {
      return view;
    }
    return {
      ...view,
      dateOfBirth: isoDate(row.dateOfBirth ?? null),
      gender: row.gender ?? null,
      phoneNumber: row.phoneNumber ?? null,
      address: row.address ?? null,
      emergencyContact: row.emergencyContact ?? null,
      bankAccount: row.bankAccount ?? null,
      salary: row.salary?.toString() ?? null,
      currency: row.currency ?? null,
      identifiers: (row.identifiers as Record<string, string> | null) ?? {},
      allowances: (row.allowances as { code: string; label?: string; amount: string }[] | null) ?? [],
    };
  }

  private isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  private async nextEmployeeId(tx: Prisma.TransactionClient, tenantId: string, offset: number) {
    const count = await tx.employee.count({ where: { tenantId } });
    for (let n = count + 1 + offset; n < count + 1 + offset + 200; n++) {
      const candidate = `EMP-${String(n).padStart(4, '0')}`;
      if (!(await tx.employee.findFirst({ where: { tenantId, employeeId: candidate }, select: { id: true } }))) {
        return candidate;
      }
    }
    throw new ConflictException('Could not allocate an employee id');
  }

  private async assertDepartment(tenantId: string, departmentId: string) {
    const found = await this.prisma.department.findFirst({ where: { id: departmentId, tenantId }, select: { id: true } });
    if (!found) {
      throw new BadRequestException('Department not found in your organization');
    }
  }

  /** The manager must be an active colleague in the same organization, and the reporting line must stay acyclic. */
  private async assertManager(tenantId: string, managerId: string, employeeId?: string) {
    const manager = await this.prisma.employee.findFirst({ where: { id: managerId, tenantId }, select: { id: true, terminationDate: true } });
    if (!manager) {
      throw new BadRequestException('Manager not found in your organization');
    }
    if (manager.terminationDate && manager.terminationDate <= new Date()) {
      throw new BadRequestException('A terminated employee cannot be a manager');
    }
    if (!employeeId) {
      return;
    }
    let cursor: string | null = managerId;
    for (let depth = 0; cursor && depth < 100; depth++) {
      if (cursor === employeeId) {
        throw new BadRequestException('This manager assignment would create a reporting loop');
      }
      const next: { managerId: string | null } | null = await this.prisma.employee.findFirst({ where: { id: cursor, tenantId }, select: { managerId: true } });
      cursor = next?.managerId ?? null;
    }
  }
}
