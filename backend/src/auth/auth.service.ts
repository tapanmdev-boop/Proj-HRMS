import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService, SAFE_USER_SELECT } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Role } from '../common/types/role.enum';

// Compared against when the account does not exist so response time does not reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const INVALID_CREDENTIALS = 'Invalid email or password';

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Resolves the organization a login is attempted against. The slug only selects; it never grants access. */
  async resolveTenantId(slug?: string): Promise<string> {
    const name = slug || this.config.get<string>('tenant.default');
    if (!name) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { name }, select: { id: true } });
    if (!tenant) {
      // Same message as a bad password: do not reveal which organizations exist.
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return tenant.id;
  }

  async login(dto: LoginDto) {
    const tenantId = await this.resolveTenantId(dto.tenant);
    const user = await this.usersService.findByEmail(dto.email, tenantId);

    const passwordOk = await bcrypt.compare(dto.password, user?.password ?? DUMMY_HASH);
    if (!user || !user.password || !passwordOk || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.usersService.updateLastLogin(user.id);
    return this.issueSession(user);
  }

  /** Creates a new organization together with its first administrator, atomically. */
  async signup(dto: SignupDto) {
    if (!this.config.get<boolean>('signupEnabled')) {
      throw new ForbiddenException('Self-service organization sign-up is disabled');
    }

    const existing = await this.prisma.tenant.findUnique({ where: { name: dto.organizationSlug }, select: { id: true } });
    if (existing) {
      throw new ConflictException('That organization slug is already taken');
    }

    const password = await this.usersService.hashPassword(dto.password);
    const user = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.organizationSlug, displayName: dto.organizationName.trim() },
      });
      return tx.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          password,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          role: Role.ADMIN,
          tenantId: tenant.id,
        },
        select: SAFE_USER_SELECT,
      });
    });

    return this.issueSession(user);
  }

  /**
   * OAuth sign-in for existing users only. Accounts are never auto-created, and an existing
   * account is linked by email only when the provider asserts the email is verified.
   */
  async validateOAuthLogin(
    provider: 'google' | 'microsoft',
    providerId: string,
    email: string | undefined,
    emailVerified: boolean,
  ) {
    const tenantId = await this.resolveTenantId();

    let user =
      provider === 'google'
        ? await this.usersService.findByGoogleId(providerId, tenantId)
        : await this.usersService.findByMicrosoftId(providerId, tenantId);

    if (!user && email && emailVerified) {
      user = await this.usersService.findByEmail(email, tenantId);
      if (user) {
        await this.usersService.linkProvider(user.id, provider, providerId);
      }
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedException('No active account is linked to this sign-in');
    }

    await this.usersService.updateLastLogin(user.id);
    return this.issueSession(user);
  }

  private issueSession(user: SessionUser) {
    // The token carries identity only; role and tenant are re-read from the database on every request.
    const accessToken = this.jwtService.sign({ sub: user.id, tenantId: user.tenantId });
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }
}
