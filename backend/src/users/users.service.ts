import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RequestContext } from '../common/decorators/request-context.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

const BCRYPT_ROUNDS = 12;

/** Fields that may leave the service. The password hash and reset tokens never do. */
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  isActive: true,
  tenantId: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto, actor: AuthUser, ctx: RequestContext = {}) {
    const role = dto.role ?? Role.EMPLOYEE;
    this.assertCanAssignRole(actor, role);

    const email = dto.email.trim().toLowerCase();
    if (await this.findByEmail(email, actor.tenantId)) {
      throw new ConflictException('A user with this email already exists');
    }

    const created = await this.prisma.user.create({
      data: {
        email,
        password: await this.hashPassword(dto.password),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        role,
        tenantId: actor.tenantId,
      },
      select: SAFE_USER_SELECT,
    });
    await this.audit.record({ action: 'user.create', tenantId: actor.tenantId, actorId: actor.id, entityType: 'user', entityId: created.id, metadata: { email, role }, ...ctx });
    return created;
  }

  async findAll(tenantId: string, query: ListUsersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where: Prisma.UserWhereInput = { tenantId };

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: SAFE_USER_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  /** Tenant-scoped lookup: a user id from another tenant is indistinguishable from a missing one. */
  async findOne(id: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({ where: { id, tenantId }, select: SAFE_USER_SELECT });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actor: AuthUser, ctx: RequestContext = {}) {
    const target = await this.findOne(id, actor.tenantId);
    const isSelf = target.id === actor.id;

    // Managing an admin account requires being an admin.
    if (target.role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only an administrator can modify an administrator');
    }
    if (dto.role !== undefined && dto.role !== target.role) {
      if (isSelf) {
        throw new ForbiddenException('You cannot change your own role');
      }
      this.assertCanAssignRole(actor, dto.role);
    }
    if (dto.isActive === false && isSelf) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.password = await this.hashPassword(dto.password);

    const updated = await this.prisma.user.update({ where: { id: target.id }, data, select: SAFE_USER_SELECT });
    await this.audit.record({
      action: 'user.update',
      tenantId: actor.tenantId,
      actorId: actor.id,
      entityType: 'user',
      entityId: target.id,
      // Field names only for the password; never its value.
      metadata: { fields: Object.keys(data), roleFrom: target.role, roleTo: updated.role, activeFrom: target.isActive, activeTo: updated.isActive },
      ...ctx,
    });
    return updated;
  }

  async remove(id: string, actor: AuthUser, ctx: RequestContext = {}) {
    const target = await this.findOne(id, actor.tenantId);
    if (target.id === actor.id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    try {
      await this.prisma.user.delete({ where: { id: target.id } });
    } catch (error) {
      // P2003: payslips or documents still reference this person's employee record.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException('This user has payroll or document records that must be retained. Deactivate the account instead.');
      }
      throw error;
    }
    await this.audit.record({ action: 'user.delete', tenantId: actor.tenantId, actorId: actor.id, entityType: 'user', entityId: target.id, metadata: { email: target.email }, ...ctx });
    return { id: target.id, deleted: true };
  }

  // ---- Lookups used by the authentication flow (include the password hash; never return these to clients) ----

  findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), tenantId } });
  }

  findByGoogleId(googleId: string, tenantId: string) {
    return this.prisma.user.findFirst({ where: { googleId, tenantId } });
  }

  findByMicrosoftId(microsoftId: string, tenantId: string) {
    return this.prisma.user.findFirst({ where: { microsoftId, tenantId } });
  }

  linkProvider(userId: string, provider: 'google' | 'microsoft', providerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: provider === 'google' ? { googleId: providerId } : { microsoftId: providerId },
    });
  }

  updateLastLogin(id: string) {
    return this.prisma.user.update({ where: { id }, data: { lastLogin: new Date() }, select: { id: true } });
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  /** Least privilege: only an admin may grant the ADMIN role. */
  private assertCanAssignRole(actor: AuthUser, role: Role) {
    if (role === Role.ADMIN && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only an administrator can assign the ADMIN role');
    }
  }
}
