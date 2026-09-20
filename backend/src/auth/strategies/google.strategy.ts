import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

/** Registered only when Google credentials are configured (see AuthModule). */
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('oauth.google.clientId'),
      clientSecret: config.get<string>('oauth.google.clientSecret'),
      callbackURL: config.get<string>('oauth.google.callbackUrl'),
      scope: ['email', 'profile'],
    });
  }

  async validate(_accessToken: string, _refreshToken: string, profile: Profile, done: VerifyCallback) {
    try {
      const primary = profile.emails?.[0] as { value: string; verified?: boolean | string } | undefined;
      const verified = primary?.verified === true || primary?.verified === 'true';
      const session = await this.authService.validateOAuthLogin('google', profile.id, primary?.value, verified);
      done(null, session);
    } catch (error) {
      done(error as Error);
    }
  }
}
