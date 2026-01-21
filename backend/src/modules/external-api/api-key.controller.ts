import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { PricingService } from '../pricing/pricing.service';

@ApiTags('API Key Management')
@Controller('settings/api-keys')
@ApiBearerAuth()
export class ApiKeyController {
  constructor(
    private readonly apiKeyService: ApiKeyService,
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * Check if user has Enterprise plan and get company ID
   * Skips plan check if pricing is disabled
   */
  private async validateEnterpriseAccess(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    // Check if pricing is enabled
    const isPricingEnabled = await this.pricingService.isPricingEnabled();

    // If pricing is enabled, check for Enterprise plan
    if (isPricingEnabled) {
      if (!user?.plan || user.plan.name !== 'ENTERPRISE') {
        throw new ForbiddenException(
          'External API access requires Enterprise plan',
        );
      }
    }

    if (!user?.currentCompanyId) {
      throw new ForbiddenException('No company selected');
    }

    return user.currentCompanyId;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: 201, description: 'API key created' })
  @ApiResponse({ status: 403, description: 'Enterprise plan required' })
  async createApiKey(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    const companyId = await this.validateEnterpriseAccess(userId);

    const { apiKey, plainKey } = await this.apiKeyService.createApiKey(
      companyId,
      dto,
    );

    return {
      ...apiKey,
      key: plainKey, // Only shown once!
      warning:
        'Store this API key securely. It will not be shown again.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys' })
  @ApiResponse({ status: 200, description: 'List of API keys' })
  async listApiKeys(@CurrentUser('id') userId: string) {
    const companyId = await this.validateEnterpriseAccess(userId);

    const apiKeys = await this.apiKeyService.listApiKeys(companyId);

    return {
      items: apiKeys,
      count: apiKeys.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key details' })
  @ApiResponse({ status: 200, description: 'API key details' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async getApiKey(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const companyId = await this.validateEnterpriseAccess(userId);

    return this.apiKeyService.getApiKey(id, companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an API key' })
  @ApiResponse({ status: 200, description: 'API key deleted' })
  @ApiResponse({ status: 404, description: 'API key not found' })
  async deleteApiKey(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const companyId = await this.validateEnterpriseAccess(userId);

    await this.apiKeyService.deleteApiKey(id, companyId);

    return { message: 'API key deleted successfully' };
  }

  @Put(':id/revoke')
  @ApiOperation({ summary: 'Revoke (deactivate) an API key' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
  async revokeApiKey(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const companyId = await this.validateEnterpriseAccess(userId);

    await this.apiKeyService.revokeApiKey(id, companyId);

    return { message: 'API key revoked successfully' };
  }

  @Put(':id/rotate')
  @ApiOperation({ summary: 'Rotate (regenerate) an API key' })
  @ApiResponse({ status: 200, description: 'API key rotated' })
  async rotateApiKey(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const companyId = await this.validateEnterpriseAccess(userId);

    const { apiKey, plainKey } = await this.apiKeyService.rotateApiKey(
      id,
      companyId,
    );

    return {
      ...apiKey,
      key: plainKey,
      warning:
        'Store this new API key securely. The old key is no longer valid.',
    };
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Get API key usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics' })
  async getUsageStats(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {
    const companyId = await this.validateEnterpriseAccess(userId);
    const daysNum = parseInt(days || '30') || 30;

    return this.apiKeyService.getUsageStats(id, companyId, daysNum);
  }
}
