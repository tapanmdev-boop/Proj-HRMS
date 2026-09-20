import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { AuthUser } from '../common/types/auth-user.interface';
import { RequestContext } from '../common/decorators/request-context.decorator';

const SELECT = { id: true, name: true, description: true, createdAt: true, updatedAt: true, _count: { select: { employees: true } } } satisfies Prisma.DepartmentSelect;

const view = (d: Prisma.DepartmentGetPayload<{ select: typeof SELECT }>) => ({
  id: d.id,
  name: d.name,
  description: d.description,
  employeeCount: d._count.employees,
  createdAt: d.createdAt,
  updatedAt: d.updatedAt,
});

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string) {
    const rows = await this.prisma.department.findMany({ where: { tenantId }, select: SELECT, orderBy: { name: 'asc' } });
    return rows.map(view);
  }

  async create(dto: CreateDepartmentDto, actor: AuthUser, ctx: RequestContext) {
    try {
      const row = await this.prisma.department.create({
        data: { name: dto.name.trim(), description: dto.description, tenantId: actor.tenantId },
        select: SELECT,
      });
      await this.audit.record({ action: 'department.create', tenantId: actor.tenantId, actorId: actor.id, entityType: 'department', entityId: row.id, metadata: { name: row.name }, ...ctx });
      return view(row);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async update(id: string, dto: UpdateDepartmentDto, actor: AuthUser, ctx: RequestContext) {
    await this.assertExists(id, actor.tenantId);
    try {
      const row = await this.prisma.department.update({ where: { id }, data: { name: dto.name?.trim(), description: dto.description }, select: SELECT });
      await this.audit.record({ action: 'department.update', tenantId: actor.tenantId, actorId: actor.id, entityType: 'department', entityId: id, metadata: { fields: Object.keys(dto) }, ...ctx });
      return view(row);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async remove(id: string, actor: AuthUser, ctx: RequestContext) {
    await this.assertExists(id, actor.tenantId);
    const inUse = await this.prisma.employee.count({ where: { departmentId: id, tenantId: actor.tenantId } });
    if (inUse > 0) {
      throw new ConflictException(`${inUse} employee(s) still belong to this department. Move them first.`);
    }
    await this.prisma.department.delete({ where: { id } });
    await this.audit.record({ action: 'department.delete', tenantId: actor.tenantId, actorId: actor.id, entityType: 'department', entityId: id, ...ctx });
    return { id, deleted: true };
  }

  private async assertExists(id: string, tenantId: string) {
    if (!(await this.prisma.department.findFirst({ where: { id, tenantId }, select: { id: true } }))) {
      throw new NotFoundException('Department not found');
    }
  }

  private translate(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return new ConflictException('A department with this name already exists');
    }
    return error;
  }
}
