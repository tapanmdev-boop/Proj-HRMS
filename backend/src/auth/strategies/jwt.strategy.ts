import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.interface';
import { Role } from '../../common/types/role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret'),
      algorithms: ['HS256'],
    });
  }

  /**
   * Role, tenant and active state are read from the database on every request, so a demoted,
   * deactivated or deleted user loses access immediately instead of when the token expires.
   */
  async validate(payload: { sub: string; tenantId: string }): Promise<AuthUser> {
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, tenantId: payload.tenantId, isActive: true },
      select: { id: true, email: true, role: true, tenantId: true, firstName: true, lastName: true },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { ...user, role: user.role as Role };
  }
}
