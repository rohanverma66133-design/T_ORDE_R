import { Body, Controller, Get, Post, Req, Res, Query, BadRequestException, Next } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../../config/env';
import { Request, Response, NextFunction } from 'express';
import * as passport from 'passport';
import {
  changePasswordSchema,
  loginWithPasswordSchema,
  refreshTokenSchema,
  requestOtpSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  type ChangePasswordInput,
  type LoginWithPasswordInput,
  type RefreshTokenInput,
  type RequestOtpInput,
  type ResetPasswordInput,
  type VerifyOtpInput,
} from '@tord/validation';
import { Public } from '../../common/decorators/auth.decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  @Public()
  @Get('google')
  async googleAuth(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction) {
    const clientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    const clientSecret = this.config.get('GOOGLE_CLIENT_SECRET', { infer: true });
    const frontendUrl = this.config.get('FRONTEND_URL', { infer: true }) || 'http://localhost:3002';

    if (!clientId || !clientSecret || clientId.trim().length === 0 || clientId === 'placeholder_client_id') {
      const errorMsg = 'Google OAuth credentials (GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET) are not configured in apps/api/.env';
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    return passport.authenticate('google', { scope: ['email', 'profile'] })(req, res, next);
  }

  @Public()
  @Get('google/callback')
  async googleAuthCallback(@Req() req: Request, @Res() res: Response, @Next() next: NextFunction, @Query('redirect') redirectQuery?: string) {
    const frontendUrl = this.config.get('FRONTEND_URL', { infer: true }) || 'http://localhost:3002';

    return passport.authenticate('google', { session: false }, (err: any, googleRes: any) => {
      if (err || !googleRes || !googleRes.tokens) {
        const errorMsg = err?.message || 'Google Authentication Failed or Cancelled';
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(errorMsg)}`);
      }

      this.setRefreshTokenCookie(res, googleRes.tokens.refreshToken);
      const targetRedirect = redirectQuery || '/';

      const redirectUrl = new URL(`${frontendUrl}/auth/callback`);
      redirectUrl.searchParams.set('accessToken', googleRes.tokens.accessToken);
      redirectUrl.searchParams.set('refreshToken', googleRes.tokens.refreshToken);
      redirectUrl.searchParams.set('user', JSON.stringify(googleRes.user));
      redirectUrl.searchParams.set('redirect', targetRedirect);

      return res.redirect(redirectUrl.toString());
    })(req, res, next);
  }

  @Public()
  @Post('google/verify')
  async verifyGoogleIdToken(
    @Body('idToken') idToken: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!idToken) {
      throw new BadRequestException({ code: 'MISSING_TOKEN', message: 'Google ID Token is required' });
    }
    const res = await this.auth.verifyGoogleIdToken(idToken);
    this.setRefreshTokenCookie(response, res.tokens.refreshToken);
    return res;
  }

  @Public()
  @Post('otp/request')
  requestOtp(@Body(new ZodValidationPipe(requestOtpSchema)) body: RequestOtpInput) {
    return this.auth.requestOtp(body);
  }

  @Public()
  @Post('otp/verify')
  async verifyOtp(
    @Body(new ZodValidationPipe(verifyOtpSchema)) body: VerifyOtpInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const res = await this.auth.verifyOtp(body);
    this.setRefreshTokenCookie(response, res.tokens.refreshToken);
    return res;
  }

  @Public()
  @Post('login/password')
  async loginWithPassword(
    @Body(new ZodValidationPipe(loginWithPasswordSchema)) body: LoginWithPasswordInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const res = await this.auth.loginWithPassword(body.emailOrPhone, body.password);
    this.setRefreshTokenCookie(response, res.tokens.refreshToken);
    return res;
  }

  @Public()
  @Post('token/refresh')
  async refresh(
    @Req() request: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = body?.refreshToken || request.cookies?.['tord_refresh_token'];
    const res = await this.auth.refresh(token);
    this.setRefreshTokenCookie(response, res.tokens.refreshToken);
    return res;
  }

  @Public()
  @Post('logout')
  async logout(
    @Req() request: Request,
    @Body() body: { refreshToken?: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = body?.refreshToken || request.cookies?.['tord_refresh_token'];
    if (token) {
      await this.auth.logout(token);
    }
    this.clearRefreshTokenCookie(response);
    return { loggedOut: true };
  }

  @Post('sessions/revoke-all')
  async revokeAllSessions(
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.revokeAllSessions(userId);
    this.clearRefreshTokenCookie(response);
    return { revoked: true };
  }

  @Post('password/change')
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const res = await this.auth.changePassword(userId, body.currentPassword, body.newPassword);
    this.clearRefreshTokenCookie(response);
    return res;
  }

  @Public()
  @Post('password/reset')
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput) {
    return this.auth.resetPassword(body);
  }

  private setRefreshTokenCookie(res: Response, token: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('tord_refresh_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('tord_refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }
}
