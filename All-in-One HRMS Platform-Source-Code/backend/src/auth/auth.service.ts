import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../common/types/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string, tenantId: string): Promise<any> {
    const user = await this.usersService.findByEmail(email, tenantId);
    
    if (!user) {
      return null;
    }
    
    if (!user.password) {
      throw new UnauthorizedException('Login with OAuth provider');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(loginDto: LoginDto, tenantId: string) {
    const user = await this.usersService.findByEmail(loginDto.email, tenantId);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or inactive account');
    }
    
    // Update last login time
    await this.usersService.updateLastLogin(user.id);
    
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto, tenantId: string) {
    const user = await this.usersService.create(registerDto, tenantId);
    return this.generateToken(user);
  }

  async validateOAuthLogin(profile: any, provider: string, tenantId: string) {
    let user: User;
    
    // Find user by provider ID
    if (provider === 'google') {
      user = await this.usersService.findByGoogleId(profile.id, tenantId);
    } else if (provider === 'microsoft') {
      user = await this.usersService.findByMicrosoftId(profile.id, tenantId);
    }
    
    // If user doesn't exist, check by email
    if (!user) {
      user = await this.usersService.findByEmail(profile.emails[0].value, tenantId);
      
      // If user exists by email, update with provider ID
      if (user) {
        if (provider === 'google') {
          await this.usersService.update(user.id, { googleId: profile.id });
        } else if (provider === 'microsoft') {
          await this.usersService.update(user.id, { microsoftId: profile.id });
        }
      } else {
        // Create a new user
        const newUser = {
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          ...(provider === 'google' ? { googleId: profile.id } : {}),
          ...(provider === 'microsoft' ? { microsoftId: profile.id } : {}),
          role: 'EMPLOYEE',
        };
        
        user = await this.usersService.createOAuthUser(newUser, tenantId);
      }
    }
    
    // Update last login time
    await this.usersService.updateLastLogin(user.id);
    
    return this.generateToken(user);
  }

  private generateToken(user: User) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      tenantId: user.tenantId,
    };
    
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
