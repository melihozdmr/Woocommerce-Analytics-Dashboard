import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUIRE_WRITE_PERMISSION } from '../guards/api-key.guard';

/**
 * Decorator to require write permission for an endpoint
 */
export const RequireWritePermission = () =>
  SetMetadata(REQUIRE_WRITE_PERMISSION, true);

/**
 * Decorator to get the validated API key from the request
 */
export const CurrentApiKey = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKey;
  },
);

/**
 * Decorator to get the company ID from the API key
 */
export const ApiCompanyId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.companyId;
  },
);
