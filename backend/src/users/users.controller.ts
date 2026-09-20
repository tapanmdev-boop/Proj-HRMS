import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReqContext, RequestContext } from '../common/decorators/request-context.decorator';
import { Role } from '../common/types/role.enum';
import { AuthUser } from '../common/types/auth-user.interface';

// Authentication and role checks are applied globally (see AppModule); every query is scoped
// to the tenant of the authenticated user.
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Create a user in your organization (Admin, HR)' })
  @ApiResponse({ status: 201, description: 'User created' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.usersService.create(dto, actor, ctx);
  }

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'List users in your organization (Admin, HR)' })
  findAll(@Query() query: ListUsersDto, @CurrentUser() actor: AuthUser) {
    return this.usersService.findAll(actor.tenantId, query);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Get a user by id (Admin, HR)' })
  @ApiResponse({ status: 404, description: 'User not found in your organization' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser) {
    return this.usersService.findOne(id, actor.tenantId);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.HR)
  @ApiOperation({ summary: 'Update a user (Admin, HR; only Admin may manage admins)' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.usersService.update(id, dto, actor, ctx);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthUser, @ReqContext() ctx: RequestContext) {
    return this.usersService.remove(id, actor, ctx);
  }
}
