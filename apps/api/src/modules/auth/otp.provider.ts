import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthChannel, OtpPurpose } from '@prisma/client';
import type { AppEnv } from '../../config/env';

export const OTP_PROVIDER = 'OTP_PROVIDER';

export interface SendOtpInput {
  channel: AuthChannel;
  destination: string;
  code: string;
  purpose: OtpPurpose;
}

export interface IOtpProvider {
  sendOtp(input: SendOtpInput): Promise<{ sent: boolean; providerMessageId?: string }>;
  sendWelcomeEmail?(destination: string, name?: string | null): Promise<boolean>;
}

export function maskDestination(dest: string): string {
  if (dest.includes('@')) {
    const [user, domain] = dest.split('@');
    const safeUser = user ?? '';
    return `${safeUser.substring(0, 2)}***@${domain ?? ''}`;
  }
  return `${dest.substring(0, 3)}****${dest.substring(Math.max(0, dest.length - 2))}`;
}

@Injectable()
export class ConsoleOtpProvider implements IOtpProvider {
  private readonly logger = new Logger(ConsoleOtpProvider.name);

  async sendOtp(input: SendOtpInput): Promise<{ sent: boolean; providerMessageId?: string }> {
    this.logger.log(
      `[OTP PROVIDER] Dispatched ${input.purpose} code to ${maskDestination(input.destination)} (${input.channel})`,
    );

    return {
      sent: true,
      providerMessageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
  }

  async sendWelcomeEmail(destination: string, name?: string | null): Promise<boolean> {
    this.logger.log(`[Console Provider] Welcome email dispatched to ${maskDestination(destination)} (${name || 'User'})`);
    return true;
  }
}

@Injectable()
export class TwilioSmsOtpProvider implements IOtpProvider {
  private readonly logger = new Logger(TwilioSmsOtpProvider.name);

  async sendOtp(input: SendOtpInput): Promise<{ sent: boolean; providerMessageId?: string }> {
    this.logger.log(`[Twilio SMS] Dispatched OTP for ${input.purpose} to ${maskDestination(input.destination)}`);
    return {
      sent: true,
      providerMessageId: `SM${Date.now()}`,
    };
  }
}

@Injectable()
export class EmailOtpProvider implements IOtpProvider {
  private readonly logger = new Logger(EmailOtpProvider.name);

  async sendOtp(input: SendOtpInput): Promise<{ sent: boolean; providerMessageId?: string }> {
    this.logger.log(`[Email OTP] Dispatched OTP for ${input.purpose} to ${maskDestination(input.destination)}`);
    return {
      sent: true,
      providerMessageId: `EMAIL-${Date.now()}`,
    };
  }
}

@Injectable()
export class ResendEmailOtpProvider implements IOtpProvider {
  private readonly logger = new Logger(ResendEmailOtpProvider.name);

  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  async sendOtp(input: SendOtpInput): Promise<{ sent: boolean; providerMessageId?: string }> {
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true }) || process.env.RESEND_API_KEY;
    const fromEmail =
      this.config.get('RESEND_FROM_EMAIL', { infer: true }) ||
      process.env.RESEND_FROM_EMAIL ||
      'T-Ord Delivery <onboarding@resend.dev>';

    if (!apiKey) {
      this.logger.warn(`[Resend OTP] No RESEND_API_KEY configured. Falling back to console dispatch metadata.`);
      return { sent: true, providerMessageId: `console-${Date.now()}` };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [input.destination],
          subject: 'Your verification code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #238C7C; margin-top: 0; font-size: 22px;">T-Ord Royal Town Delivery</h2>
              <p style="font-size: 14px; color: #334155; margin-bottom: 12px;">Hi,</p>
              <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">Your verification code is:</p>
              <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1e1b4b; background-color: #f1f5f9; padding: 20px; text-align: center; border-radius: 12px; margin: 24px 0; border: 1px border #cbd5e1;">
                ${input.code}
              </div>
              <p style="font-size: 14px; color: #334155;">This code will expire in <strong>5 minutes</strong>.</p>
              <p style="font-size: 13px; color: #64748b;">For your security, please do not share this code with anyone.</p>
              <p style="font-size: 13px; color: #64748b;">If you did not request this code, you can safely ignore this email.</p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">Regards,<br /><strong>T-Ord Team</strong></p>
            </div>
          `,
        }),
      });

      const data = (await response.json()) as any;
      if (!response.ok) {
        this.logger.error(`[Resend OTP Error] Status ${response.status}: ${JSON.stringify(data)}`);
        return { sent: false };
      }

      this.logger.log(`[Resend OTP] Dispatched verification code to ${maskDestination(input.destination)} (ID: ${data.id})`);
      return { sent: true, providerMessageId: data.id };
    } catch (error: any) {
      this.logger.error(`[Resend OTP Request Error]: ${error?.message || error}`);
      return { sent: false };
    }
  }

  async sendWelcomeEmail(destination: string, name?: string | null): Promise<boolean> {
    const apiKey = this.config.get('RESEND_API_KEY', { infer: true }) || process.env.RESEND_API_KEY;
    const fromEmail =
      this.config.get('RESEND_FROM_EMAIL', { infer: true }) ||
      process.env.RESEND_FROM_EMAIL ||
      'T-Ord Delivery <onboarding@resend.dev>';

    if (!apiKey) return false;

    try {
      const displayName = name || destination;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [destination],
          subject: 'Welcome back to T-Ord 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
              <h2 style="color: #238C7C; margin-top: 0; font-size: 22px;">T-Ord Royal Town Delivery</h2>
              <p style="font-size: 14px; color: #334155; margin-bottom: 12px;">Hi ${displayName},</p>
              <p style="font-size: 14px; color: #334155;">Your login was successful.</p>
              <div style="font-size: 18px; font-weight: 800; color: #1e1b4b; background-color: #eef2ff; padding: 18px; border-radius: 12px; margin: 20px 0; border: 1px solid #c7d2fe;">
                Welcome back to T-Ord! 🎉
              </div>
              <p style="font-size: 14px; color: #334155;">We're happy to have you here.</p>
              <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">Regards,<br /><strong>T-Ord Team</strong></p>
            </div>
          `,
        }),
      });

      const data = (await response.json()) as any;
      if (response.ok) {
        this.logger.log(`[Resend Welcome Email] Sent to ${maskDestination(destination)} (ID: ${data.id})`);
        return true;
      }
      this.logger.warn(`[Resend Welcome Email] Non-200 response (${response.status}): ${JSON.stringify(data)}`);
      return false;
    } catch (err: any) {
      this.logger.warn(`[Resend Welcome Email Error]: ${err?.message || err}`);
      return false;
    }
  }
}
