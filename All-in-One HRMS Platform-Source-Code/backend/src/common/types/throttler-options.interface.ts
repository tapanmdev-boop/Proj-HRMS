import { ThrottlerModuleOptions as BaseThrottlerOptions } from '@nestjs/throttler';

export type ThrottlerModuleOptions = BaseThrottlerOptions & {
  ttl: number;
  limit: number;
};
