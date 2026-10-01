import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';
import { of } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

describe('ResponseEnvelopeInterceptor', () => {
  it('wraps payloads in the standard success envelope', (done) => {
    const interceptor = new ResponseEnvelopeInterceptor();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ header: () => 'req-1' }),
      }),
    } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of({ ok: true }) };

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value.success).toBe(true);
      expect(value.data).toEqual({ ok: true });
      expect(value.meta.requestId).toBe('req-1');
      done();
    });
  });
});
