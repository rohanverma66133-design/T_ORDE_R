import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response, NextFunction } from 'express';
import type { AppEnv } from '../../config/env';

@Injectable()
export class CsrfProtectionMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService<AppEnv, true>) {}

  use(req: Request, _res: Response, next: NextFunction): void {
    const isStateChangingMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    const hasCookieAuth = Boolean(req.cookies?.['tord_refresh_token'] || req.cookies?.['tord_access_token']);

    if (isStateChangingMethod && hasCookieAuth) {
      const origin = req.headers.origin;
      const referer = req.headers.referer;
      const trustedOrigin = this.config.get('WEB_ORIGIN', { infer: true });
      const validOrigin = origin === trustedOrigin || Boolean(referer?.startsWith(`${trustedOrigin}/`));

      // Refresh cookies are HttpOnly, so browser requests must prove they came
      // from our own web origin. Bearer-token requests do not use this path.
      if (!validOrigin) {
        throw new ForbiddenException({
          code: 'CSRF_VALIDATION_FAILED',
          message: 'Trusted origin required for cookie-authenticated request',
        });
      }
    }

    next();
  }
}
