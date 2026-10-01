import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import type { RequestOtpInput, VerifyOtpInput } from '@tord/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import { AuditService } from '../audit/audit.service';
import { RoleCode, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../../config/env';

@Injectable()
export class AuthService {
  constructor(
    private readonly otp: OtpService,
    private readonly tokens: TokenService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async requestOtp(input: RequestOtpInput) {
    const res = await this.otp.request({
      channel: input.channel,
      destination: input.destination,
      purpose: input.purpose,
    });

    this.audit.record({
      action: 'SECURITY_OTP_REQUESTED',
      entityType: 'User',
      metadata: { channel: input.channel, destination: input.destination, purpose: input.purpose },
    });

    return { requested: true, cooldownRemaining: res.cooldownRemaining };
  }

  async verifyOtp(input: VerifyOtpInput) {
    const valid = await this.otp.verify({
      destination: input.destination,
      purpose: input.purpose,
      code: input.code,
    });
    if (!valid) {
      this.audit.record({
        action: 'SECURITY_OTP_FAILED',
        entityType: 'User',
        metadata: { destination: input.destination, purpose: input.purpose },
      });
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' });
    }

    const user = await this.findOrCreateUser(input);
    const roles = user.roles.map((item) => item.role.code);
    const tokens = await this.tokens.issue(user.id, roles);

    this.audit.record({
      actorId: user.id,
      action: 'SECURITY_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      metadata: { method: 'OTP', channel: input.channel, destination: input.destination },
    });

    // Send Welcome / Login Success Email ONLY AFTER successful OTP verification
    if (input.channel === 'EMAIL' || input.destination.includes('@')) {
      const targetEmail = input.destination.trim().toLowerCase();
      if (this.otp.provider?.sendWelcomeEmail) {
        Promise.resolve(this.otp.provider.sendWelcomeEmail(targetEmail, user.name || null)).catch((err) => {
          console.warn('[Welcome Email Async Exception Handler]:', err?.message || err);
        });
      }
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles,
      },
      tokens,
    };
  }

  async loginWithPassword(emailOrPhone: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.passwordHash) {
      this.audit.record({
        action: 'SECURITY_LOGIN_FAILED',
        entityType: 'User',
        metadata: { identifier: emailOrPhone, reason: 'User or password hash not found' },
      });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' });
    }

    const passwordMatches = await argon2.verify(user.passwordHash, password);
    if (!passwordMatches) {
      this.audit.record({
        actorId: user.id,
        action: 'SECURITY_LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        metadata: { identifier: emailOrPhone, reason: 'Password mismatch' },
      });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email/phone or password' });
    }

    const roles = user.roles.map((r) => r.role.code);
    const tokens = await this.tokens.issue(user.id, roles);

    this.audit.record({
      actorId: user.id,
      action: 'SECURITY_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      metadata: { method: 'PASSWORD' },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles,
      },
      tokens,
    };
  }

  async refresh(refreshToken: string) {
    const tokens = await this.tokens.rotate(refreshToken);
    return { tokens };
  }

  async logout(refreshToken: string, userId?: string) {
    await this.tokens.revoke(refreshToken);

    if (userId) {
      this.audit.record({
        actorId: userId,
        action: 'SECURITY_LOGOUT',
        entityType: 'User',
        entityId: userId,
      });
    }

    return { loggedOut: true };
  }

  async revokeAllSessions(userId: string) {
    await this.tokens.revokeAllUserSessions(userId);

    this.audit.record({
      actorId: userId,
      action: 'SECURITY_ALL_SESSIONS_REVOKED',
      entityType: 'User',
      entityId: userId,
    });

    return { revoked: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException({ code: 'INVALID_USER', message: 'User account has no password set' });
    }

    const matches = await argon2.verify(user.passwordHash, currentPassword);
    if (!matches) {
      this.audit.record({
        actorId: userId,
        action: 'SECURITY_PASSWORD_CHANGE_FAILED',
        entityType: 'User',
        entityId: userId,
        metadata: { reason: 'Current password mismatch' },
      });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Current password does not match' });
    }

    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all active refresh token sessions on password change
    await this.tokens.revokeAllUserSessions(userId);

    this.audit.record({
      actorId: userId,
      action: 'SECURITY_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
    });

    return { updated: true };
  }

  async resetPassword(input: { destination: string; code: string; newPassword: string; channel?: string }) {
    const valid = await this.otp.verify({
      destination: input.destination,
      purpose: 'RESET' as any,
      code: input.code,
    });

    if (!valid) {
      throw new UnauthorizedException({ code: 'INVALID_OTP', message: 'Invalid or expired reset OTP code' });
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: input.destination }, { phone: input.destination }],
      },
    });

    if (!user) {
      throw new BadRequestException({ code: 'USER_NOT_FOUND', message: 'No user account found for destination' });
    }

    const newHash = await argon2.hash(input.newPassword, { type: argon2.argon2id });
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await this.tokens.revokeAllUserSessions(user.id);

    this.audit.record({
      actorId: user.id,
      action: 'SECURITY_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      metadata: { method: 'OTP_RESET' },
    });

    return { reset: true };
  }

  async validateGoogleUser(profile: { id: string; email: string; name: string; picture?: string | null }) {
    if (!profile.email) {
      throw new BadRequestException({ code: 'INVALID_GOOGLE_PROFILE', message: 'Google account missing email address' });
    }

    const emailClean = profile.email.trim().toLowerCase();

    // 1. Try to find user by googleId
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.id },
      include: { roles: { include: { role: true } } },
    });

    if (user) {
      // Returning Google User - update lastLoginAt and avatar/name if missing
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          avatarUrl: profile.picture || user.avatarUrl,
          name: user.name || profile.name,
        },
        include: { roles: { include: { role: true } } },
      });
    } else {
      // 2. Account Linking: Search by verified email
      const existingEmailUser = await this.prisma.user.findUnique({
        where: { email: emailClean },
        include: { roles: { include: { role: true } } },
      });

      if (existingEmailUser) {
        // Link Google account to existing user
        user = await this.prisma.user.update({
          where: { id: existingEmailUser.id },
          data: {
            googleId: profile.id,
            avatarUrl: existingEmailUser.avatarUrl || profile.picture,
            name: existingEmailUser.name || profile.name,
            emailVerifiedAt: existingEmailUser.emailVerifiedAt || new Date(),
            lastLoginAt: new Date(),
          },
          include: { roles: { include: { role: true } } },
        });
      } else {
        // 3. Create new User account
        const customerRole = await this.prisma.role.findUniqueOrThrow({
          where: { code: RoleCode.CUSTOMER },
        });

        user = await this.prisma.user.create({
          data: {
            email: emailClean,
            name: profile.name,
            googleId: profile.id,
            avatarUrl: profile.picture,
            status: UserStatus.ACTIVE,
            emailVerifiedAt: new Date(),
            authProvider: 'GOOGLE',
            lastLoginAt: new Date(),
            roles: { create: { roleId: customerRole.id } },
          },
          include: { roles: { include: { role: true } } },
        });
      }
    }

    const roles = user.roles.map((item) => item.role.code);
    const tokens = await this.tokens.issue(user.id, roles);

    this.audit.record({
      actorId: user.id,
      action: 'SECURITY_LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      metadata: { method: 'GOOGLE_OAUTH', email: emailClean, googleId: profile.id },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        roles,
      },
      tokens,
    };
  }

  async verifyGoogleIdToken(idToken: string) {
    const googleClientId = this.config.get('GOOGLE_CLIENT_ID', { infer: true });
    if (!googleClientId) {
      throw new BadRequestException({ code: 'GOOGLE_AUTH_DISABLED', message: 'Google OAuth is not configured on server' });
    }

    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(googleClientId);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new UnauthorizedException({ code: 'INVALID_GOOGLE_TOKEN', message: 'Invalid or unverified Google ID Token' });
    }

    return this.validateGoogleUser({
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.given_name || 'Google User',
      picture: payload.picture || null,
    });
  }

  private async findOrCreateUser(input: VerifyOtpInput) {
    const existing =
      input.channel === 'EMAIL'
        ? await this.prisma.user.findUnique({
            where: { email: input.destination },
            include: { roles: { include: { role: true } } },
          })
        : await this.prisma.user.findUnique({
            where: { phone: input.destination },
            include: { roles: { include: { role: true } } },
          });

    if (existing) {
      return existing;
    }

    const customerRole = await this.prisma.role.findUniqueOrThrow({
      where: { code: RoleCode.CUSTOMER },
    });

    return this.prisma.user.create({
      data: {
        email: input.channel === 'EMAIL' ? input.destination : undefined,
        phone: input.channel === 'PHONE' ? input.destination : undefined,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: input.channel === 'EMAIL' ? new Date() : undefined,
        phoneVerifiedAt: input.channel === 'PHONE' ? new Date() : undefined,
        roles: { create: { roleId: customerRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });
  }
}
