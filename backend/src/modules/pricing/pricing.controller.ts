import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { PricingService } from './pricing.service';
import { PlanService } from './plan.service';
import { PlanType } from '@prisma/client';

@Controller('pricing')
export class PricingController {
  constructor(
    private readonly pricingService: PricingService,
    private readonly planService: PlanService,
  ) {}

  /**
   * Get all available plans
   */
  @Public()
  @Get('plans')
  async getPlans() {
    const plans = await this.planService.getAllPlans();
    return { plans };
  }

  /**
   * Get current pricing status
   */
  @Public()
  @Get('status')
  async getPricingStatus() {
    return this.pricingService.getPricingStatus();
  }

  /**
   * Get current user's plan info
   */
  @Get('my-plan')
  @UseGuards(JwtAuthGuard)
  async getMyPlan(@Request() req: { user: { id: string } }) {
    const userId = req.user.id;
    const planInfo = await this.planService.getUserPlanInfo(userId);
    return {
      plan: {
        id: planInfo.plan.id,
        name: planInfo.plan.name,
        displayName: planInfo.plan.displayName,
        storeLimit: planInfo.storeLimit,
        refreshInterval: planInfo.plan.refreshInterval,
        historyDays: planInfo.plan.historyDays,
        priceMonthly: planInfo.plan.priceMonthly,
        priceYearly: planInfo.plan.priceYearly,
      },
      isGrandfathered: planInfo.isGrandfathered,
      features: planInfo.features,
    };
  }

  /**
   * Get current user's usage info
   */
  @Get('usage')
  @UseGuards(JwtAuthGuard)
  async getUsage(@Request() req: { user: { id: string } }) {
    const userId = req.user.id;
    return this.planService.getUserUsage(userId);
  }

  /**
   * Request plan upgrade
   * Note: In production, this would integrate with payment system
   */
  @Post('upgrade')
  @UseGuards(JwtAuthGuard)
  async requestUpgrade(
    @Request() req: { user: { id: string } },
    @Body() body: { planType: PlanType },
  ) {
    const userId = req.user.id;
    return this.planService.upgradePlan(userId, body.planType);
  }

  /**
   * Toggle pricing system (Admin only)
   * In production, add admin guard
   */
  @Put('toggle')
  @UseGuards(JwtAuthGuard)
  async togglePricing(@Body() body: { enabled: boolean }) {
    const enabled = await this.pricingService.togglePricing(body.enabled);
    return { enabled };
  }

  /**
   * Grandfather existing users (Admin only)
   * Run this once when enabling pricing
   */
  @Post('grandfather-users')
  @UseGuards(JwtAuthGuard)
  async grandfatherUsers() {
    const count = await this.planService.grandfatherExistingUsers();
    return {
      success: true,
      message: `${count} kullanıcı grandfather olarak işaretlendi`,
      count,
    };
  }
}
