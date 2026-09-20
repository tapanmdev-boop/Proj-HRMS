import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, ListHolidaysDto } from './dto/leave.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

@ApiTags('holidays')
@ApiBearerAuth()
@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidays: HolidaysService) {}

  @Get()
  @ApiOperation({ summary: 'Holidays of your organization (not counted as working days)' })
  list(@Query() query: ListHolidaysDto, @CurrentUser() actor: AuthUser) {
    return this.holidays.list(actor.tenantId, query.year);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() dto: CreateHolidayDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.holidays.create(dto, actor, ctx);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HR)
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.holidays.remove(id, actor, ctx);
  }
}
