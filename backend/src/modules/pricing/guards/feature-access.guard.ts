import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanService, PlanFeatures } from '../plan.service';

export const REQUIRED_FEATURE_KEY = 'required_feature';

@Injectable()
export class FeatureAccessGuard implements CanActivate {
  constructor(
    private readonly planService: PlanService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.get<keyof PlanFeatures>(
      REQUIRED_FEATURE_KEY,
      context.getHandler(),
    );

    // If no feature is required, allow access
    if (!requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Kullanıcı doğrulanmamış');
    }

    const hasAccess = await this.planService.hasFeatureAccess(
      userId,
      requiredFeature,
    );

    if (!hasAccess) {
      throw new ForbiddenException({
        message: `Bu özellik mevcut planınızda kullanılamıyor`,
        code: 'FEATURE_NOT_AVAILABLE',
        feature: requiredFeature,
        upgradeRequired: true,
      });
    }

    return true;
  }
}
