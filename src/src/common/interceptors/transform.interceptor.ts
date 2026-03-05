import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

export interface Response<T> {
  data: T;
  meta: {
    timestamp: string;
    requestId: string;
    [key: string]: unknown;
  };
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();
    const reqId =
      (request as unknown as { id?: string }).id ||
      request.headers['x-request-id'] ||
      'unknown';

    return next.handle().pipe(
      map((data: unknown) => {
        // Handle paginated responses where data already contains metadata
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          const typedData = data as { data: T; meta: Record<string, unknown> };
          return {
            data: typedData.data,
            meta: {
              ...typedData.meta,
              timestamp: new Date().toISOString(),
              requestId: reqId as string,
            },
          };
        }

        return {
          data: data as T,
          meta: {
            timestamp: new Date().toISOString(),
            requestId: reqId as string,
          },
        };
      }),
    );
  }
}
