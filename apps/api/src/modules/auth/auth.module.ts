import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../common/guards/jwt.strategy';
import { AuditModule } from '../audit/audit.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';
import {
  OTP_PROVIDER,
  ConsoleOtpProvider,
  TwilioSmsOtpProvider,
  EmailOtpProvider,
  ResendEmailOtpProvider,
} from './otp.provider';
import { GoogleStrategy } from './google.strategy';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from '../../config/env';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({}), AuditModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    TokenService,
    JwtStrategy,
    GoogleStrategy,
    ConsoleOtpProvider,
    TwilioSmsOtpProvider,
    EmailOtpProvider,
    ResendEmailOtpProvider,
    {
      provide: OTP_PROVIDER,
      useFactory: (config: ConfigService<AppEnv, true>) => {
        const providerType = config.get('OTP_PROVIDER_TYPE', { infer: true });
        const resendKey = config.get('RESEND_API_KEY', { infer: true }) || process.env.RESEND_API_KEY;

        if ((resendKey && resendKey.trim().length > 0) || providerType === 'resend' || providerType === 'email') {
          return new ResendEmailOtpProvider(config);
        }
        if (providerType === 'twilio') {
          return new TwilioSmsOtpProvider();
        }
        return new ConsoleOtpProvider();
      },
      inject: [ConfigService],
    },
  ],
  exports: [TokenService, OtpService, AuthService],
})
export class AuthModule {}
