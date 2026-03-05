import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const errorResponseObj =
      typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponse as Record<string, unknown>)
        : {};

    const message =
      typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponseObj['message'] as string) ||
          (errorResponseObj['error'] as string) ||
          'Internal server error'
        : errorResponse;

    const error =
      exception instanceof HttpException
        ? (errorResponseObj['error'] as string) || exception.name
        : 'Internal Server Error';

    const reqId =
      (request as unknown as { id?: string }).id ||
      request.headers['x-request-id'] ||
      'unknown';

    const problemDetails: Record<string, unknown> = {
      status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: reqId,
    };

    if (status >= 500) {
      this.logger.error(
        `[ReqID: ${String(reqId)}] ${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[ReqID: ${String(reqId)}] ${request.method} ${request.url} - ${status} - ${JSON.stringify(message)}`,
      );
    }

    // Never expose internal errors stack traces in production
    if (process.env.NODE_ENV !== 'development' && status === 500) {
      problemDetails.message = 'Internal server error';
    }

    response.status(status).json(problemDetails);
  }
}
