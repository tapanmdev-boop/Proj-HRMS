import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseEnumPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeaveType } from '@prisma/client';
import { LeaveService } from './leave.service';
import { BalanceQueryDto, CreateLeaveDto, DecideLeaveDto, ListLeaveDto, SetPolicyDto } from './dto/leave.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

@ApiTags('leave')
@ApiBearerAuth()
@Controller('leave')
export class LeaveController {
  constructor(private readonly leave: LeaveService) {}

  @Get()
  @ApiOperation({ summary: 'List leave: your own (default), your team (managers), or everyone (HR/Admin)' })
  list(@Query() query: ListLeaveDto, @CurrentUser() actor: AuthUser) {
    return this.leave.list(actor, query);
  }

  @Post()
  @ApiOperation({ summary: 'Request leave for yourself; working days are computed from the organization calendar' })
  create(@Body() dto: CreateLeaveDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.leave.create(actor, dto, ctx);
  }

  @Get('balances')
  @ApiOperation({ summary: 'Entitlement, used, pending and remaining days per leave type' })
  balances(@Query() query: BalanceQueryDto, @CurrentUser() actor: AuthUser) {
    return this.leave.balances(actor, query);
  }

  @Get('policies')
  @ApiOperation({ summary: 'Annual entitlements per leave type' })
  policies(@CurrentUser() actor: AuthUser) {
    return this.leave.listPolicies(actor.tenantId);
  }

  @Put('policies/:type')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Set the annual entitlement for a leave type (Admin, HR)' })
  setPolicy(
    @Param('type', new ParseEnumPipe(LeaveType)) type: LeaveType,
    @Body() dto: SetPolicyDto,
    @CurrentUser() actor: AuthUser,
    @ReqContext() ctx: RequestContext,
  ) {
    return this.leave.setPolicy(type, dto.daysPerYear, actor, ctx);
  }

  @Delete('policies/:type')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Remove a policy so the type is no longer balance-limited (Admin, HR)' })
  removePolicy(@Param('type', new ParseEnumPipe(LeaveType)) type: LeaveType, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.leave.removePolicy(type, actor, ctx);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.leave.decide(id, 'approve', undefined, actor, ctx);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideLeaveDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.leave.decide(id, 'reject', dto.reason, actor, ctx);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.leave.cancel(id, actor, ctx);
  }
}
