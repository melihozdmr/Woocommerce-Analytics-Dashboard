import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { createHash, randomBytes } from 'crypto';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

export interface ApiKeyPermissions {
  read: boolean;
  write: boolean;
}

export interface GeneratedApiKey {
  key: string; // Full key - only shown once
  prefix: string;
  hash: string;
}

export interface ValidatedApiKey {
  id: string;
  companyId: string;
  name: string;
  permissions: ApiKeyPermissions;
}

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a new API key
   * Format: wca_<64 hex characters>
   */
  generateApiKey(): GeneratedApiKey {
    const rawKey = randomBytes(32).toString('hex');
    const fullKey = `wca_${rawKey}`;
    const prefix = rawKey.substring(0, 8);
    const hash = createHash('sha256').update(fullKey).digest('hex');

    return {
      key: fullKey,
      prefix,
      hash,
    };
  }

  /**
   * Hash an API key for comparison
   */
  hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Create a new API key for a company
   */
  async createApiKey(
    companyId: string,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: any; plainKey: string }> {
    const generated = this.generateApiKey();

    const permissions = dto.permissions || { read: true, write: false };

    const apiKey = await this.prisma.apiKey.create({
      data: {
        companyId,
        keyHash: generated.hash,
        keyPrefix: generated.prefix,
        name: dto.name,
        permissions: JSON.parse(JSON.stringify(permissions)),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      plainKey: generated.key, // Only returned once!
    };
  }

  /**
   * Validate an API key and return company info
   */
  async validateApiKey(key: string): Promise<ValidatedApiKey | null> {
    if (!key || !key.startsWith('wca_')) {
      return null;
    }

    const hash = this.hashApiKey(key);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash: hash },
      include: {
        company: {
          include: {
            members: {
              where: { role: 'OWNER' },
              include: { user: { include: { plan: true } } },
            },
          },
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    // Check if key is active
    if (!apiKey.isActive) {
      return null;
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    // Check if user has Enterprise plan
    const owner = apiKey.company.members[0]?.user;
    if (!owner?.plan || owner.plan.name !== 'ENTERPRISE') {
      throw new ForbiddenException(
        'External API access requires Enterprise plan',
      );
    }

    // Update last used timestamp (fire and forget)
    this.prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return {
      id: apiKey.id,
      companyId: apiKey.companyId,
      name: apiKey.name,
      permissions: apiKey.permissions as unknown as ApiKeyPermissions,
    };
  }

  /**
   * List all API keys for a company
   */
  async listApiKeys(companyId: string) {
    return this.prisma.apiKey.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single API key
   */
  async getApiKey(id: string, companyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revokeApiKey(id: string, companyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, companyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(id: string, companyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, companyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return this.prisma.apiKey.delete({
      where: { id },
    });
  }

  /**
   * Rotate (regenerate) an API key
   */
  async rotateApiKey(
    id: string,
    companyId: string,
  ): Promise<{ apiKey: any; plainKey: string }> {
    const existingKey = await this.prisma.apiKey.findFirst({
      where: { id, companyId },
    });

    if (!existingKey) {
      throw new NotFoundException('API key not found');
    }

    const generated = this.generateApiKey();

    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data: {
        keyHash: generated.hash,
        keyPrefix: generated.prefix,
        lastUsedAt: null, // Reset last used
      },
    });

    return {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      plainKey: generated.key,
    };
  }

  /**
   * Log API usage
   */
  async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.apiUsageLog.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        statusCode,
        responseTimeMs,
        ipAddress,
        userAgent,
      },
    });
  }

  /**
   * Get usage statistics for an API key
   */
  async getUsageStats(id: string, companyId: string, days: number = 30) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id, companyId },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalRequests, statusDistribution, endpointStats, dailyStats] =
      await Promise.all([
        // Total requests
        this.prisma.apiUsageLog.count({
          where: { apiKeyId: id, createdAt: { gte: since } },
        }),

        // Status code distribution
        this.prisma.apiUsageLog.groupBy({
          by: ['statusCode'],
          where: { apiKeyId: id, createdAt: { gte: since } },
          _count: true,
        }),

        // Top endpoints
        this.prisma.apiUsageLog.groupBy({
          by: ['endpoint', 'method'],
          where: { apiKeyId: id, createdAt: { gte: since } },
          _count: true,
          _avg: { responseTimeMs: true },
          orderBy: { _count: { endpoint: 'desc' } },
          take: 10,
        }),

        // Daily request count
        this.prisma.$queryRaw`
          SELECT
            DATE(created_at) as date,
            COUNT(*)::int as count,
            AVG(response_time_ms)::int as avg_response_time
          FROM api_usage_logs
          WHERE api_key_id = ${id}
            AND created_at >= ${since}
          GROUP BY DATE(created_at)
          ORDER BY date DESC
        `,
      ]);

    return {
      totalRequests,
      statusDistribution: statusDistribution.map((s) => ({
        statusCode: s.statusCode,
        count: s._count,
      })),
      topEndpoints: endpointStats.map((e) => ({
        endpoint: e.endpoint,
        method: e.method,
        count: e._count,
        avgResponseTime: Math.round(e._avg.responseTimeMs || 0),
      })),
      dailyStats,
    };
  }
}
