import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.printf(({ level, message, timestamp, ms, reqId }) => {
              return `[${timestamp}] [${level}] ${reqId ? `[ReqID: ${reqId}] ` : ''}${message} ${ms}`;
            }),
          ),
        }),
      ],
    }),
  });

  // Request ID middleware for structured logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = req.headers['x-request-id'] || uuidv4();
    (req as any).id = reqId;
    res.setHeader('x-request-id', reqId);
    next();
  });

  // Security Middlewares
  app.use(helmet());
  app.use((cookieParser as any)());
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true });

  // API Versioning
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
