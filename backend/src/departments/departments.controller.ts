import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

@ApiTags('departments')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Departments in your organization' })
  list(@CurrentUser() actor: AuthUser) {
    return this.departments.list(actor.tenantId);
  }

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  create(@Body() dto: CreateDepartmentDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.departments.create(dto, actor, ctx);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.departments.update(id, dto, actor, ctx);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Delete an empty department' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.departments.remove(id, actor, ctx);
  }
}
