import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  action: string; // dotted verb, e.g. "user.create", "auth.login.failed"
  tenantId?: string | null;
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/** Keys that must never be written to the audit trail, at any depth. */
const REDACTED_KEYS = /pass(word)?|token|secret|authorization|bank|salary/i;

const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, REDACTED_KEYS.test(k) ? '[redacted]' : redact(v)]));
  }
  return value;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Writes an audit record. Failures are logged but never thrown, so auditing cannot take the
   * business operation down; callers that need stronger guarantees should write inside their own transaction.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          tenantId: entry.tenantId ?? null,
          actorId: entry.actorId ?? null,
          entityType: entry.entityType,
          entityId: entry.entityId,
          metadata: entry.metadata ? (redact(entry.metadata) as Prisma.InputJsonValue) : undefined,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent?.slice(0, 300),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit record "${entry.action}"`, (error as Error).stack);
    }
  }
}
