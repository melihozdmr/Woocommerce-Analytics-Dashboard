import { Module } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PlanService } from './plan.service';
import { PricingController } from './pricing.controller';
import { StoreLimitGuard } from './guards/store-limit.guard';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [PricingController],
  providers: [
    PricingService,
    PlanService,
    StoreLimitGuard,
    FeatureAccessGuard,
  ],
  exports: [PricingService, PlanService, StoreLimitGuard, FeatureAccessGuard],
})
export class PricingModule {}
