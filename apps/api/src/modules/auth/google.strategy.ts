import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';
import type { AppEnv } from '../../config/env';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService<AppEnv, true>,
    private readonly authService: AuthService,
  ) {
    const clientID = config.get('GOOGLE_CLIENT_ID', { infer: true }) || 'placeholder_client_id';
    const clientSecret = config.get('GOOGLE_CLIENT_SECRET', { infer: true }) || 'placeholder_client_secret';
    const callbackURL = config.get('GOOGLE_CALLBACK_URL', { infer: true }) || 'http://localhost:3001/api/v1/auth/google/callback';

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const result = await this.authService.validateGoogleUser({
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        name: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
        picture: profile.photos?.[0]?.value || null,
      });
      done(null, result);
    } catch (err) {
      done(err as Error, false);
    }
  }
}
