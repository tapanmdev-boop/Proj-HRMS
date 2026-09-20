import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/types/role.enum';
import { User } from '../common/types/user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto, tenantId: string): Promise<User> {
    const { email, password, ...rest } = createUserDto;
    
    // Check if user already exists in this tenant
    const existingUser = await this.findByEmail(email, tenantId);
    
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await this.hashPassword(password);
    
    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
        tenantId,
      },
    });
  }

  async createOAuthUser(userData: any, tenantId: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...userData,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.withTenant(tenantId).user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        tenantId: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    
    return user;
  }

  async findByEmail(email: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        tenantId,
      },
    });
  }

  async findByGoogleId(googleId: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        googleId,
        tenantId,
      },
    });
  }

  async findByMicrosoftId(microsoftId: string, tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        microsoftId,
        tenantId,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...rest } = updateUserDto;
    
    const data: any = { ...rest };
    
    if (password) {
      data.password = await this.hashPassword(password);
    }
    
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        lastLogin: new Date(),
      },
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
