import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ListEmployeesDto } from './dto/list-employees.dto';
import { TerminateEmployeeDto } from './dto/terminate-employee.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

@ApiTags('employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employees: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'Employee directory. Admin/HR also receive personal and pay data' })
  list(@Query() query: ListEmployeesDto, @CurrentUser() actor: AuthUser) {
    return this.employees.list(actor, query);
  }

  // Declared before ':id' so "me" is not parsed as an id.
  @Get('me')
  @ApiOperation({ summary: 'Your own employee record, including your personal and pay data' })
  me(@CurrentUser() actor: AuthUser) {
    return this.employees.findMe(actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One employee. Personal and pay data only for Admin/HR or the employee themself' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.employees.findOne(id, actor);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Create an employee together with their login (Admin, HR)' })
  create(@Body() dto: CreateEmployeeDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.employees.create(dto, actor, ctx);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Update an employee (Admin, HR)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.employees.update(id, dto, actor, ctx);
  }

  @Post(':id/terminate')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'End employment; retains history and revokes access on the termination date (Admin, HR)' })
  terminate(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TerminateEmployeeDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.employees.terminate(id, dto, actor, ctx);
  }
}
