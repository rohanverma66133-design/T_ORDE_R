import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthTokens } from '@tord/types';
import type { AppEnv } from '../../config/env';
import { hashRefreshToken } from '../../common/crypto/refresh-token';
import { generateRefreshToken, parseDurationToSeconds } from '../../common/crypto/secrets';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
  ) {}

  async issue(userId: string, roles: string[]): Promise<AuthTokens> {
    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true });
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true });
    const expiresIn = parseDurationToSeconds(accessExpires);
    const accessToken = await this.jwt.signAsync(
      { sub: userId, roles },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: accessExpires,
      },
    );
    const refreshToken = generateRefreshToken();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDurationToSeconds(refreshExpires) * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn,
    };
  }

  async rotate(refreshToken: string): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(refreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { roles: { include: { role: true } } } } },
    });

    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Invalid or revoked refresh token' });
    }

    // Token rotation must be atomic: two simultaneous refresh requests may
    // inspect the same valid token, but only one may consume it.
    const consumed = await this.prisma.refreshToken.updateMany({
      where: { id: existing.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    if (consumed.count !== 1) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Refresh token was already used or revoked' });
    }

    // Issue new pair
    return this.issue(
      existing.userId,
      existing.user.roles.map((item) => item.role.code),
    );
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
