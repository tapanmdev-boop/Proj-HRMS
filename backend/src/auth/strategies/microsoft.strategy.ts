import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-microsoft';
import { AuthService } from '../auth.service';

/**
 * Registered only when Microsoft credentials are configured (see AuthModule).
 * Microsoft does not assert email verification, so accounts are matched by provider id only
 * (an administrator must link the provider id); email-based linking is deliberately not done.
 */
@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('oauth.microsoft.clientId'),
      clientSecret: config.get<string>('oauth.microsoft.clientSecret'),
      callbackURL: config.get<string>('oauth.microsoft.callbackUrl'),
      scope: ['user.read', 'openid', 'profile', 'email'],
      tenant: 'common',
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: { id: string; emails?: { value: string }[] },
    done: (error: Error | null, user?: unknown) => void,
  ) {
    try {
      const session = await this.authService.validateOAuthLogin('microsoft', profile.id, profile.emails?.[0]?.value, false);
      done(null, session);
    } catch (error) {
      done(error as Error);
    }
  }
}
