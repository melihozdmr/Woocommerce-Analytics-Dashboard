import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../database/prisma.service';
import { PricingService } from './pricing.service';
import { PlanType, Plan, InviteStatus } from '@prisma/client';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface PlanFeatures {
  csvExport: boolean;
  pdfExport: boolean;
  emailReports: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

export interface UserPlanInfo {
  plan: Plan;
  isGrandfathered: boolean;
  storeCount: number;
  storeLimit: number;
  canAddStore: boolean;
  features: PlanFeatures;
}

export interface UsageInfo {
  storeCount: number;
  storeLimit: number;
  usagePercentage: number;
  isAtLimit: boolean;
  isNearLimit: boolean; // 80% or more
}

@Injectable()
export class PlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get all available plans
   */
  async getAllPlans(): Promise<Plan[]> {
    const cacheKey = 'plans:all';
    const cached = await this.cacheManager.get<Plan[]>(cacheKey);
    if (cached) return cached;

    const plans = await this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });

    await this.cacheManager.set(cacheKey, plans, CACHE_TTL);
    return plans;
  }

  /**
   * Get a specific plan by type
   */
  async getPlanByType(type: PlanType): Promise<Plan | null> {
    return this.prisma.plan.findUnique({
      where: { name: type },
    });
  }

  /**
   * Get user's current plan info
   */
  async getUserPlanInfo(userId: string): Promise<UserPlanInfo> {
    const pricingEnabled = await this.pricingService.isPricingEnabled();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (!user) {
      throw new ForbiddenException('Kullanıcı bulunamadı');
    }

    // Get store count for the user (through company memberships)
    const storeCount = await this.getUserStoreCount(userId);

    // If pricing is disabled, return unlimited access
    if (!pricingEnabled) {
      const freePlan = await this.getPlanByType(PlanType.FREE);
      return {
        plan: freePlan!,
        isGrandfathered: false,
        storeCount,
        storeLimit: 999, // Unlimited when pricing is off
        canAddStore: true,
        features: {
          csvExport: true,
          pdfExport: true,
          emailReports: true,
          apiAccess: true,
          prioritySupport: true,
        },
      };
    }

    // If user is grandfathered, they keep unlimited access
    if (user.grandfathered) {
      const plan = user.plan || (await this.getPlanByType(PlanType.FREE));
      return {
        plan: plan!,
        isGrandfathered: true,
        storeCount,
        storeLimit: 999,
        canAddStore: true,
        features: {
          csvExport: true,
          pdfExport: true,
          emailReports: true,
          apiAccess: true,
          prioritySupport: true,
        },
      };
    }

    // Get user's plan (default to FREE if not set)
    const plan = user.plan || (await this.getPlanByType(PlanType.FREE));
    if (!plan) {
      throw new ForbiddenException('Plan bulunamadı');
    }

    const features = plan.features as unknown as PlanFeatures;

    return {
      plan,
      isGrandfathered: false,
      storeCount,
      storeLimit: plan.storeLimit,
      canAddStore: storeCount < plan.storeLimit,
      features,
    };
  }

  /**
   * Get user's usage info
   */
  async getUserUsage(userId: string): Promise<UsageInfo> {
    const planInfo = await this.getUserPlanInfo(userId);

    const usagePercentage =
      planInfo.storeLimit === 999
        ? 0
        : Math.round((planInfo.storeCount / planInfo.storeLimit) * 100);

    return {
      storeCount: planInfo.storeCount,
      storeLimit: planInfo.storeLimit,
      usagePercentage,
      isAtLimit: planInfo.storeCount >= planInfo.storeLimit,
      isNearLimit: usagePercentage >= 80,
    };
  }

  /**
   * Check if user can add a new store
   */
  async canAddStore(userId: string): Promise<boolean> {
    const planInfo = await this.getUserPlanInfo(userId);
    return planInfo.canAddStore;
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(
    userId: string,
    feature: keyof PlanFeatures,
  ): Promise<boolean> {
    const planInfo = await this.getUserPlanInfo(userId);
    return planInfo.features[feature] === true;
  }

  /**
   * Get store limit for a plan
   */
  async getStoreLimit(planId: string): Promise<number> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
    });
    return plan?.storeLimit || 2;
  }

  /**
   * Get refresh interval for a user's plan (in minutes)
   */
  async getRefreshInterval(userId: string): Promise<number> {
    const pricingEnabled = await this.pricingService.isPricingEnabled();

    if (!pricingEnabled) {
      return 1; // Fastest when pricing is disabled
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (user?.grandfathered) {
      return 1; // Fastest for grandfathered users
    }

    return user?.plan?.refreshInterval || 15;
  }

  /**
   * Get history days limit for a user's plan
   */
  async getHistoryDays(userId: string): Promise<number> {
    const pricingEnabled = await this.pricingService.isPricingEnabled();

    if (!pricingEnabled) {
      return 730; // Max when pricing is disabled
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true },
    });

    if (user?.grandfathered) {
      return 730; // Max for grandfathered users
    }

    return user?.plan?.historyDays || 30;
  }

  /**
   * Upgrade user's plan
   */
  async upgradePlan(
    userId: string,
    newPlanType: PlanType,
  ): Promise<{ success: boolean; message: string }> {
    const newPlan = await this.getPlanByType(newPlanType);
    if (!newPlan) {
      return { success: false, message: 'Plan bulunamadı' };
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { planId: newPlan.id },
    });

    return {
      success: true,
      message: `Planınız ${newPlan.displayName} olarak güncellendi`,
    };
  }

  /**
   * Get user's store count across all companies
   */
  private async getUserStoreCount(userId: string): Promise<number> {
    // Get all companies user is a member of
    const memberships = await this.prisma.companyMember.findMany({
      where: {
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
      },
      include: {
        company: {
          include: {
            stores: true,
          },
        },
      },
    });

    // Count total stores across all companies
    return memberships.reduce((total, membership) => {
      return total + membership.company.stores.length;
    }, 0);
  }

  /**
   * Mark existing users as grandfathered
   * Should be run once when pricing is enabled
   */
  async grandfatherExistingUsers(): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: { grandfathered: false },
      data: { grandfathered: true },
    });

    return result.count;
  }
}
