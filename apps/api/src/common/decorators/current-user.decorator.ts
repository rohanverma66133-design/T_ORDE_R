import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AuthenticatedUser {
  sub: string;
  roles: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | 'id' | undefined, ctx: ExecutionContext): AuthenticatedUser | string | string[] | undefined => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    if (!data) {
      return request.user;
    }
    // `id` is retained as a safe compatibility alias for the JWT subject.
    return data === 'id' ? request.user?.sub : request.user?.[data];
  },
);
