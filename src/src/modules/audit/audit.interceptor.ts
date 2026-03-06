import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    // Only audit mutating actions
    if (method === 'GET' || method === 'OPTIONS') {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        try {
          const user = request.user;
          if (user) {
            await this.auditLogRepo.save({
              user_id: user.sub,
              action: method,
              resource_type: url,
              resource_id: 'N/A', // Further refinement would extract this from route params
              details: { body: request.body },
            });
          }
        } catch (error) {
           this.logger.error(`Audit logging failed: ${error.message}`);
        }
      }),
    );
  }
}
