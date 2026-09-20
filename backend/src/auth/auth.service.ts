import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UsersService, SAFE_USER_SELECT } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Role } from '../common/types/role.enum';
import { RequestContext } from '../common/decorators/request-context.decorator';

// Compared against when the account does not exist so response time does not reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_REFRESH = 'Invalid or expired refresh token';
const DAY_MS = 24 * 60 * 60 * 1000;

interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  /** Resolves the organization a login is attempted against. The slug only selects; it never grants access. */
  async resolveTenantId(slug?: string): Promise<string> {
    const name = slug || this.config.get<string>('tenant.default');
    if (!name) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { name }, select: { id: true, isActive: true } });
    if (!tenant || !tenant.isActive) {
      // Same message as a bad password: do not reveal which organizations exist.
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return tenant.id;
  }

  async login(dto: LoginDto, ctx: RequestContext) {
    const tenantId = await this.resolveTenantId(dto.tenant).catch(async (error) => {
      await this.audit.record({ action: 'auth.login.failed', metadata: { reason: 'unknown_or_inactive_organization', email: dto.email }, ...ctx });
      throw error;
    });
    const user = await this.usersService.findByEmail(dto.email, tenantId);

    const passwordOk = await bcrypt.compare(dto.password, user?.password ?? DUMMY_HASH);
    if (!user || !user.password || !passwordOk || !user.isActive) {
      await this.audit.record({
        action: 'auth.login.failed',
        tenantId,
        actorId: user?.id,
        metadata: { reason: !user ? 'unknown_user' : !user.isActive ? 'inactive_user' : 'bad_password', email: dto.email },
        ...ctx,
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.usersService.updateLastLogin(user.id);
    await this.audit.record({ action: 'auth.login', tenantId, actorId: user.id, ...ctx });
    return this.issueSession(user, ctx);
  }

  /** Creates a new organization together with its first administrator, atomically. */
  async signup(dto: SignupDto, ctx: RequestContext) {
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
        data: {
          name: dto.organizationSlug,
          displayName: dto.organizationName.trim(),
          countryCode: dto.countryCode,
          defaultLocale: dto.defaultLocale,
          defaultTimezone: dto.defaultTimezone,
          baseCurrency: dto.baseCurrency,
          weekendDays: dto.weekendDays ? [...dto.weekendDays].sort((a, b) => a - b) : undefined,
        },
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

    await this.audit.record({ action: 'tenant.create', tenantId: user.tenantId, actorId: user.id, entityType: 'tenant', entityId: user.tenantId, ...ctx });
    return this.issueSession(user, ctx);
  }

  /**
   * Exchanges a refresh token for a new access token and a new refresh token (rotation).
   * Presenting an already-used token signals theft, so the whole token family is revoked.
   */
  async refresh(rawToken: string, ctx: RequestContext) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
    if (!stored) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    if (stored.revokedAt) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: stored.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ action: 'auth.refresh.reuse_detected', actorId: stored.userId, metadata: { familyId: stored.familyId }, ...ctx });
      throw new UnauthorizedException(INVALID_REFRESH);
    }
    if (stored.expiresAt <= new Date()) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    const user = await this.prisma.user.findFirst({
      where: { id: stored.userId, isActive: true, tenant: { isActive: true } },
      select: SAFE_USER_SELECT,
    });
    if (!user) {
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    // Atomically claim the token; a concurrent second use loses the race and is treated as reuse.
    const next = this.newRefreshToken(user.id, stored.familyId, ctx);
    const claimed = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.updateMany({ where: { id: stored.id, revokedAt: null }, data: { revokedAt: new Date() } });
      if (count === 0) {
        return false;
      }
      const created = await tx.refreshToken.create({ data: next.record });
      await tx.refreshToken.update({ where: { id: stored.id }, data: { replacedById: created.id } });
      return true;
    });
    if (!claimed) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: stored.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException(INVALID_REFRESH);
    }

    return this.buildSession(user, next.raw);
  }

  /** Revokes the token's whole family. Always succeeds so callers cannot probe for valid tokens. */
  async logout(rawToken: string, ctx: RequestContext) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: sha256(rawToken) } });
    if (stored) {
      await this.prisma.refreshToken.updateMany({ where: { familyId: stored.familyId, revokedAt: null }, data: { revokedAt: new Date() } });
      await this.audit.record({ action: 'auth.logout', actorId: stored.userId, ...ctx });
    }
    return { success: true };
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
    ctx: RequestContext = {},
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
    await this.audit.record({ action: `auth.login.${provider}`, tenantId, actorId: user.id, ...ctx });
    return this.issueSession(user, ctx);
  }

  private async issueSession(user: SessionUser, ctx: RequestContext) {
    const { raw, record } = this.newRefreshToken(user.id, randomUUID(), ctx);
    await this.prisma.refreshToken.create({ data: record });
    return this.buildSession(user, raw);
  }

  private newRefreshToken(userId: string, familyId: string, ctx: RequestContext) {
    const raw = randomBytes(48).toString('base64url');
    const ttlDays = this.config.get<number>('jwt.refreshTtlDays');
    return {
      raw,
      record: {
        userId,
        familyId,
        tokenHash: sha256(raw),
        expiresAt: new Date(Date.now() + ttlDays * DAY_MS),
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent?.slice(0, 300),
      },
    };
  }

  private buildSession(user: SessionUser, refreshToken: string) {
    // The access token carries identity only; role and tenant are re-read from the database on every request.
    const accessToken = this.jwtService.sign({ sub: user.id, tenantId: user.tenantId });
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<number>('jwt.expirationTime'),
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
