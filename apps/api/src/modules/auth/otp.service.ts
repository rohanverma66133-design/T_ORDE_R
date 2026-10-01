import { HttpException, HttpStatus, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthChannel, OtpPurpose } from '@prisma/client';
import type { AppEnv } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { generateNumericCode, hashSecret, verifySecret } from '../../common/crypto/secrets';
import { OTP_PROVIDER, type IOtpProvider } from './otp.provider';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppEnv, true>,
    @Inject(OTP_PROVIDER) public readonly provider: IOtpProvider,
  ) {}

  normalizeDestination(dest: string, channel: AuthChannel): string {
    const trimmed = dest.trim();
    if (channel === 'EMAIL') {
      return trimmed.toLowerCase();
    }
    return trimmed;
  }

  async request(input: {
    channel: AuthChannel;
    destination: string;
    purpose: OtpPurpose;
    userId?: string;
  }): Promise<{ expiresIn: number; cooldownRemaining: number }> {
    const COOLDOWN_SECONDS = 60;
    const normalizedDest = this.normalizeDestination(input.destination, input.channel);

    // 1. Resend Cooldown Enforcement (60 seconds)
    const recentChallenge = await this.prisma.otpChallenge.findFirst({
      where: {
        destination: normalizedDest,
        purpose: input.purpose,
        createdAt: { gte: new Date(Date.now() - COOLDOWN_SECONDS * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentChallenge) {
      const elapsedSeconds = Math.floor((Date.now() - recentChallenge.createdAt.getTime()) / 1000);
      const remaining = Math.max(1, COOLDOWN_SECONDS - elapsedSeconds);
      throw new HttpException(
        {
          code: 'OTP_COOLDOWN',
          message: `Please wait ${remaining} seconds before requesting another verification code`,
          cooldownRemaining: remaining,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 2. Invalidate any previous unconsumed OTP challenges for this destination
    await this.prisma.otpChallenge.updateMany({
      where: {
        destination: normalizedDest,
        purpose: input.purpose,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });

    const length = this.config.get('OTP_CODE_LENGTH', { infer: true });
    const expiresIn = this.config.get('OTP_EXPIRES_IN_SECONDS', { infer: true });

    // Deterministic OTPs are permitted only for explicitly opted-in test runs.
    const useFixedTestOtp =
      this.config.get('NODE_ENV', { infer: true }) === 'test' &&
      this.config.get('ALLOW_FIXED_TEST_OTP', { infer: true });
    const code = useFixedTestOtp ? '123456' : generateNumericCode(length);
    const codeHash = await hashSecret(code);

    await this.prisma.otpChallenge.create({
      data: {
        channel: input.channel,
        destination: normalizedDest,
        purpose: input.purpose,
        userId: input.userId,
        codeHash,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    // Dispatch via Provider Abstraction (raw code is sent only to provider, NEVER logged)
    await this.provider.sendOtp({
      channel: input.channel,
      destination: normalizedDest,
      code,
      purpose: input.purpose,
    });

    return { expiresIn, cooldownRemaining: COOLDOWN_SECONDS };
  }

  async verify(input: {
    channel?: AuthChannel;
    destination: string;
    purpose: OtpPurpose;
    code: string;
  }): Promise<boolean> {
    const channel = input.channel || (input.destination.includes('@') ? 'EMAIL' : 'PHONE');
    const normalizedDest = this.normalizeDestination(input.destination, channel);

    const challenge = await this.prisma.otpChallenge.findFirst({
      where: {
        destination: normalizedDest,
        purpose: input.purpose,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'No active OTP request found. Please request a code.' });
    }

    // 2. Expiration Check (5 minutes)
    if (challenge.expiresAt < new Date()) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new UnauthorizedException({ code: 'OTP_EXPIRED', message: 'OTP code has expired. Please request a new code.' });
    }

    // 3. Attempt Limit Check (max 5 attempts)
    const maxAttempts = this.config.get('OTP_MAX_ATTEMPTS', { infer: true }) || 5;
    if (challenge.attempts >= maxAttempts) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { consumedAt: new Date() },
      });
      throw new UnauthorizedException({
        code: 'OTP_MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new verification code.',
      });
    }

    // 4. Secure Secret Verification
    const isValid = await verifySecret(challenge.codeHash, input.code.trim());

    // Increment attempts count
    const updatedAttempts = challenge.attempts + 1;
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        attempts: updatedAttempts,
        // Mark as single-use consumed immediately if valid OR max attempts reached
        consumedAt: isValid || updatedAttempts >= maxAttempts ? new Date() : undefined,
      },
    });

    if (!isValid) {
      const remainingAttempts = maxAttempts - updatedAttempts;
      throw new UnauthorizedException({
        code: 'INVALID_OTP',
        message: remainingAttempts > 0
          ? `Invalid OTP code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.`
          : 'Invalid OTP code. Maximum verification attempts reached.',
      });
    }

    return true;
  }
}
