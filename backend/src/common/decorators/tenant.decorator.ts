import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Resolves the tenant of the authenticated user. The value comes from the
 * database-backed principal set by JwtStrategy, never from a client header.
 */
export const TenantDecorator = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.tenantId as string | undefined;
});
