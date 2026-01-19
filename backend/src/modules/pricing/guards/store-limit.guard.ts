import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PlanService } from '../plan.service';

@Injectable()
export class StoreLimitGuard implements CanActivate {
  constructor(private readonly planService: PlanService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Kullanıcı doğrulanmamış');
    }

    const canAdd = await this.planService.canAddStore(userId);

    if (!canAdd) {
      const usage = await this.planService.getUserUsage(userId);
      throw new ForbiddenException({
        message: 'Mağaza limitinize ulaştınız',
        code: 'STORE_LIMIT_REACHED',
        currentCount: usage.storeCount,
        limit: usage.storeLimit,
        upgradeRequired: true,
      });
    }

    return true;
  }
}
