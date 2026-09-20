import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('oauth.microsoft.clientId'),
      clientSecret: configService.get('oauth.microsoft.clientSecret'),
      callbackURL: configService.get('oauth.microsoft.callbackUrl'),
      scope: ['user.read', 'openid', 'profile', 'email'],
      tenant: 'common',
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: Function,
  ): Promise<any> {
    const tenantId = req['tenantId'];
    const { accessToken: jwt, user } = await this.authService.validateOAuthLogin(profile, 'microsoft', tenantId);
    
    const payload = {
      jwt,
      user,
    };
    
    done(null, payload);
  }
}
