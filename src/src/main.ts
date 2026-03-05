import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.printf((info) => {
              const { level, message, timestamp, ms, reqId } = info;
              const reqIdStr =
                typeof reqId === 'string'
                  ? reqId
                  : reqId
                    ? JSON.stringify(reqId)
                    : '';
              return `[${String(timestamp)}] [${String(level)}] ${reqId ? `[ReqID: ${reqIdStr}] ` : ''}${String(message)} ${String(ms)}`;
            }),
          ),
        }),
      ],
    }),
  });

  // Request ID middleware for structured logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = (req.headers['x-request-id'] || uuidv4()) as string;
    (req as { id?: string }).id = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  });

  // Security Middlewares
  app.use(helmet());
  app.use((cookieParser as unknown as () => any)());
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API Versioning
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT || 3000);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
