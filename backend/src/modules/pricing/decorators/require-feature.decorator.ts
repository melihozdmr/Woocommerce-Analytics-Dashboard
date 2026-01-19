import { SetMetadata } from '@nestjs/common';
import { PlanFeatures } from '../plan.service';
import { REQUIRED_FEATURE_KEY } from '../guards/feature-access.guard';

/**
 * Decorator to mark an endpoint as requiring a specific feature
 * Use with FeatureAccessGuard
 *
 * @example
 * @RequireFeature('csvExport')
 * @UseGuards(JwtAuthGuard, FeatureAccessGuard)
 * async exportToCsv() { ... }
 */
export const RequireFeature = (feature: keyof PlanFeatures) =>
  SetMetadata(REQUIRED_FEATURE_KEY, feature);
