import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiKeyService, ValidatedApiKey } from '../api-key.service';

export const API_KEY_METADATA = 'apiKey';
export const REQUIRE_WRITE_PERMISSION = 'requireWritePermission';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Extract API key from header
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key is required. Provide it via X-API-Key header or Authorization: Bearer <key>',
        },
      });
    }

    // Validate API key
    let validatedKey: ValidatedApiKey | null;
    try {
      validatedKey = await this.apiKeyService.validateApiKey(apiKey);
    } catch (error) {
      throw error; // Re-throw ForbiddenException for plan check
    }

    if (!validatedKey) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key',
        },
      });
    }

    // Check write permission if required
    const requireWrite = this.reflector.get<boolean>(
      REQUIRE_WRITE_PERMISSION,
      context.getHandler(),
    );

    if (requireWrite && !validatedKey.permissions.write) {
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'This API key does not have write permission',
        },
      });
    }

    // Attach validated key info to request
    request.apiKey = validatedKey;
    request.companyId = validatedKey.companyId;

    return true;
  }

  private extractApiKey(request: any): string | null {
    // Check X-API-Key header first
    const xApiKey = request.headers['x-api-key'];
    if (xApiKey) {
      return xApiKey;
    }

    // Check Authorization: Bearer header
    const authHeader = request.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Only treat as API key if it starts with wca_
      if (token.startsWith('wca_')) {
        return token;
      }
    }

    return null;
  }
}
