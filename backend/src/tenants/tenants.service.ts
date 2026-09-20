import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { AuthUser } from '../common/types/auth-user.interface';
import { RequestContext } from '../common/decorators/request-context.decorator';

const TENANT_SELECT = {
  id: true,
  name: true,
  displayName: true,
  countryCode: true,
  defaultLocale: true,
  defaultTimezone: true,
  baseCurrency: true,
  weekStartsOn: true,
  fiscalYearStartMonth: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCurrent(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: TENANT_SELECT });
    if (!tenant) {
      throw new NotFoundException('Organization not found');
    }
    return tenant;
  }

  async updateCurrent(actor: AuthUser, dto: UpdateTenantDto, ctx: RequestContext) {
    const before = await this.getCurrent(actor.tenantId);
    const after = await this.prisma.tenant.update({
      where: { id: actor.tenantId },
      data: {
        displayName: dto.displayName?.trim(),
        countryCode: dto.countryCode,
        defaultLocale: dto.defaultLocale,
        defaultTimezone: dto.defaultTimezone,
        baseCurrency: dto.baseCurrency,
        weekStartsOn: dto.weekStartsOn,
        fiscalYearStartMonth: dto.fiscalYearStartMonth,
      },
      select: TENANT_SELECT,
    });

    const changed = Object.keys(dto).filter((key) => before[key as keyof typeof before] !== after[key as keyof typeof after]);
    await this.audit.record({
      action: 'tenant.update',
      tenantId: actor.tenantId,
      actorId: actor.id,
      entityType: 'tenant',
      entityId: actor.tenantId,
      metadata: {
        changes: Object.fromEntries(changed.map((key) => [key, { from: before[key as keyof typeof before], to: after[key as keyof typeof after] }])),
      },
      ...ctx,
    });
    return after;
  }
}
