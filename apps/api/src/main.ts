import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { json, raw, urlencoded } from 'express';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import type { AppEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<AppEnv, true>);
  const prefix = config.get('API_PREFIX', { infer: true });

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  // The payment provider signs the exact bytes. This route must be registered before JSON parsing.
  app.use(`/payments/webhook`, raw({ type: 'application/json', limit: '1mb' }));
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
  );
  app.setGlobalPrefix(prefix);
  const webOrigin = config.get('WEB_ORIGIN', { infer: true });
  app.enableCors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      const allowedOrigins = [webOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://localhost:3002'];
      if (allowedOrigins.includes(requestOrigin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  });
  app.enableShutdownHooks();

  const swagger = new DocumentBuilder()
    .setTitle('T-Ord API')
    .setDescription('Town-level grocery and medicine delivery API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup(`${prefix}/docs`, app, SwaggerModule.createDocument(app, swagger));

  const port = config.get('API_PORT', { infer: true });
  const host = config.get('API_HOST', { infer: true });
  await app.listen(port, host);
}

void bootstrap();
