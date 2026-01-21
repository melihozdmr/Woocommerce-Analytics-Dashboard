import { Module } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { ApiKeyController } from './api-key.controller';
import { ExternalApiController } from './external-api.controller';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiRateLimitGuard } from './guards/api-rate-limit.guard';
import { DatabaseModule } from '../../database/database.module';
import { PricingModule } from '../pricing/pricing.module';

@Module({
  imports: [DatabaseModule, PricingModule],
  controllers: [ApiKeyController, ExternalApiController],
  providers: [ApiKeyService, ApiKeyGuard, ApiRateLimitGuard],
  exports: [ApiKeyService],
})
export class ExternalApiModule {}
