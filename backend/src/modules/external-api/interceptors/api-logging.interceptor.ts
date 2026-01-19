import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiKeyService } from '../api-key.service';

@Injectable()
export class ApiLoggingInterceptor implements NestInterceptor {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    const apiKeyId = request.apiKey?.id;
    const endpoint = request.route?.path || request.url;
    const method = request.method;
    const ipAddress = request.ip || request.connection?.remoteAddress;
    const userAgent = request.headers['user-agent'];

    const logUsage = (statusCode: number) => {
      if (apiKeyId) {
        const responseTime = Date.now() - startTime;
        this.apiKeyService
          .logUsage(
            apiKeyId,
            endpoint,
            method,
            statusCode,
            responseTime,
            ipAddress,
            userAgent,
          )
          .catch((err) => {
            console.error('Failed to log API usage:', err);
          });
      }
    };

    return next.handle().pipe(
      tap(() => {
        logUsage(response.statusCode);
      }),
      catchError((error) => {
        logUsage(error.status || 500);
        throw error;
      }),
    );
  }
}
