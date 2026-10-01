import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { ApiSuccessResponse } from '@tord/types';
import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.header(REQUEST_ID_HEADER) ?? 'unknown';

    return next.handle().pipe(
      map((data: unknown) => ({
        success: true as const,
        data,
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
