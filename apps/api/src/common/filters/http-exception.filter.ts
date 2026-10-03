import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorResponse } from '@tord/types';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.header(REQUEST_ID_HEADER) ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const payload = exception.getResponse();
      message = exception.message;
      if (typeof payload === 'object' && payload !== null) {
        const record = payload as Record<string, unknown>;
        if (typeof record['message'] === 'string') {
          message = record['message'];
        }
        if (typeof record['code'] === 'string') {
          code = record['code'];
        }
        details = record['details'] ?? record['message'];
      }
      if (status === HttpStatus.UNAUTHORIZED) {
        code = 'UNAUTHORIZED';
      }
      if (status === HttpStatus.FORBIDDEN) {
        code = 'FORBIDDEN';
      }
      if (status === HttpStatus.NOT_FOUND) {
        code = 'NOT_FOUND';
      }
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        code = 'RATE_LIMITED';
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = 'VALIDATION_ERROR';
      message = 'Request validation failed';
      details = exception.flatten();
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      message = exception.message || 'An unexpected error occurred';
      details = exception.message;
    } else {
      this.logger.error('Unknown exception', String(exception));
    }

    const body: ApiErrorResponse = {
      success: false,
      error: { code, message, details },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(body);
  }
}
