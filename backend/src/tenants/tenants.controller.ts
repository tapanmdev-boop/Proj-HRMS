import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

@ApiTags('tenant')
@ApiBearerAuth()
@Controller('tenant')
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Current organization and its regional settings' })
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.tenants.getCurrent(user.tenantId);
  }

  @Patch()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update organization name and regional settings (Admin)' })
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateTenantDto, @ReqContext() ctx: RequestContext) {
    return this.tenants.updateCurrent(user, dto, ctx);
  }
}
