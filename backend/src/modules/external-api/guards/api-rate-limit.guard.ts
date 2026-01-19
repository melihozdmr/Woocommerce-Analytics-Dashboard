import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const RATE_LIMIT_MAX = 100; // requests
const RATE_LIMIT_WINDOW = 60; // seconds

@Injectable()
export class ApiRateLimitGuard implements CanActivate {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: any) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get API key ID from request (set by ApiKeyGuard)
    const apiKeyId = request.apiKey?.id;
    if (!apiKeyId) {
      return true; // No rate limiting without API key
    }

    const key = `rate_limit:${apiKeyId}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Get current rate limit data
    let rateLimitData: { requests: number[]; resetAt: number } | undefined =
      await this.cacheManager.get(key);

    if (!rateLimitData) {
      rateLimitData = {
        requests: [],
        resetAt: now + RATE_LIMIT_WINDOW,
      };
    }

    // Filter out expired requests
    rateLimitData.requests = rateLimitData.requests.filter(
      (timestamp) => timestamp > windowStart,
    );

    // Calculate remaining requests
    const remaining = Math.max(0, RATE_LIMIT_MAX - rateLimitData.requests.length);
    const resetAt = rateLimitData.requests.length > 0
      ? Math.min(...rateLimitData.requests) + RATE_LIMIT_WINDOW
      : now + RATE_LIMIT_WINDOW;

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX.toString());
    response.setHeader('X-RateLimit-Remaining', remaining.toString());
    response.setHeader('X-RateLimit-Reset', resetAt.toString());

    // Check if rate limit exceeded
    if (rateLimitData.requests.length >= RATE_LIMIT_MAX) {
      response.setHeader('Retry-After', (resetAt - now).toString());

      throw new HttpException(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded. Please try again later.',
            details: {
              limit: RATE_LIMIT_MAX,
              remaining: 0,
              resetAt: new Date(resetAt * 1000).toISOString(),
              retryAfter: resetAt - now,
            },
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current request to the window
    rateLimitData.requests.push(now);

    // Update cache
    await this.cacheManager.set(key, rateLimitData, RATE_LIMIT_WINDOW * 1000);

    return true;
  }
}
