import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  override getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const redirect = req.query?.redirect as string;
    return {
      scope: ['email', 'profile'],
      state: redirect || '/',
    };
  }
}
