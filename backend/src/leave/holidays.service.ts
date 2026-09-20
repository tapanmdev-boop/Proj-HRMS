import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/types/auth-user.interface';
import { RequestContext } from '../common/decorators/request-context.decorator';
import { CreateHolidayDto } from './dto/leave.dto';

const view = (h: { id: string; date: Date; name: string }) => ({ id: h.id, date: h.date.toISOString().slice(0, 10), name: h.name });

@Injectable()
export class HolidaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(tenantId: string, year?: number) {
    const where: Prisma.HolidayWhereInput = { tenantId };
    if (year) where.date = { gte: new Date(`${year}-01-01`), lte: new Date(`${year}-12-31`) };
    return (await this.prisma.holiday.findMany({ where, orderBy: { date: 'asc' } })).map(view);
  }

  async create(dto: CreateHolidayDto, actor: AuthUser, ctx: RequestContext) {
    try {
      const row = await this.prisma.holiday.create({ data: { tenantId: actor.tenantId, date: new Date(dto.date), name: dto.name.trim() } });
      await this.audit.record({ action: 'holiday.create', tenantId: actor.tenantId, actorId: actor.id, entityType: 'holiday', entityId: row.id, metadata: { date: dto.date, name: row.name }, ...ctx });
      return view(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A holiday already exists on that date');
      }
      throw error;
    }
  }

  async remove(id: string, actor: AuthUser, ctx: RequestContext) {
    const { count } = await this.prisma.holiday.deleteMany({ where: { id, tenantId: actor.tenantId } });
    if (count === 0) throw new NotFoundException('Holiday not found');
    await this.audit.record({ action: 'holiday.delete', tenantId: actor.tenantId, actorId: actor.id, entityType: 'holiday', entityId: id, ...ctx });
    return { id, deleted: true };
  }
}
