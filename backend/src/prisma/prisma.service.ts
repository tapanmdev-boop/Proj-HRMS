import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // @ts-ignore - Prisma client has $on method
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  // Helper method for multi-tenancy
  withTenant(tenantId: string) {
    return {
      user: {
        async findMany({ where = {}, ...args } = {}) {
          return this.user.findMany({
            where: {
              ...where,
              tenantId,
            },
            ...args,
          });
        },
        async findUnique({ where, ...args }) {
          return this.user.findFirst({
            where: {
              ...where,
              tenantId,
            },
            ...args,
          });
        },
        async create({ data, ...args }) {
          return this.user.create({
            data: {
              ...data,
              tenantId,
            },
            ...args,
          });
        },
      },
      // Similar extensions for other models
      employee: {
        async findMany({ where = {}, ...args } = {}) {
          return this.employee.findMany({
            where: {
              ...where,
              tenantId,
            },
            ...args,
          });
        },
        async findUnique({ where, ...args }) {
          return this.employee.findFirst({
            where: {
              ...where,
              tenantId,
            },
            ...args,
          });
        },
      },
      // Add similar methods for other models as needed
    };
  }
}
