import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

/** Client network context for audit records. */
export const ReqContext = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestContext => {
  const req = ctx.switchToHttp().getRequest();
  return { ipAddress: req.ip, userAgent: req.headers?.['user-agent'] };
});
