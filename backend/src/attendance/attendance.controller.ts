import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { ClockDto, CreateCorrectionDto, DecideCorrectionDto, ListAttendanceDto, ListCorrectionsDto, SummaryQueryDto } from './dto/attendance.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post('clock-in')
  @ApiOperation({ summary: 'Start today\'s session. The day is the organization-local calendar day' })
  clockIn(@Body() dto: ClockDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.attendance.clockIn(actor, dto, ctx);
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End your open session' })
  clockOut(@Body() dto: ClockDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.attendance.clockOut(actor, dto, ctx);
  }

  @Get('today')
  @ApiOperation({ summary: 'Your current clock status' })
  today(@CurrentUser() actor: AuthUser) {
    return this.attendance.today(actor);
  }

  @Get()
  @ApiOperation({ summary: 'Attendance records: your own (default), your team (managers), or everyone (HR/Admin)' })
  list(@Query() query: ListAttendanceDto, @CurrentUser() actor: AuthUser) {
    return this.attendance.list(actor, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Present, leave, absent and worked hours for one employee over a date range' })
  summary(@Query() query: SummaryQueryDto, @CurrentUser() actor: AuthUser) {
    return this.attendance.summary(actor, query);
  }

  @Post('corrections')
  @ApiOperation({ summary: 'Request a correction for a day (times are in the organization timezone)' })
  createCorrection(@Body() dto: CreateCorrectionDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.attendance.createCorrection(actor, dto, ctx);
  }

  @Get('corrections')
  listCorrections(@Query() query: ListCorrectionsDto, @CurrentUser() actor: AuthUser) {
    return this.attendance.listCorrections(actor, query);
  }

  @Post('corrections/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.attendance.decideCorrection(id, 'approve', undefined, actor, ctx);
  }

  @Post('corrections/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN, Role.HR, Role.MANAGER)
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideCorrectionDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.attendance.decideCorrection(id, 'reject', dto.reason, actor, ctx);
  }

  @Post('corrections/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.attendance.cancelCorrection(id, actor, ctx);
  }
}
