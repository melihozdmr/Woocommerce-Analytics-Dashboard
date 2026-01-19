import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PlanService } from './plan.service';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../database/prisma.service';
import { PlanType, InviteStatus } from '@prisma/client';

describe('PlanService', () => {
  let service: PlanService;
  let prismaService: PrismaService;
  let pricingService: PricingService;
  let cacheManager: any;

  const mockUserId = 'user-123';
  const mockCompanyId = 'company-123';

  const mockFreePlan = {
    id: 'plan-free',
    name: PlanType.FREE,
    displayName: 'Free',
    storeLimit: 2,
    refreshInterval: 15,
    historyDays: 30,
    priceMonthly: 0,
    priceYearly: 0,
    features: {
      csvExport: false,
      pdfExport: false,
      emailReports: false,
      apiAccess: false,
      prioritySupport: false,
    },
    isActive: true,
    createdAt: new Date(),
  };

  const mockProPlan = {
    id: 'plan-pro',
    name: PlanType.PRO,
    displayName: 'Pro',
    storeLimit: 5,
    refreshInterval: 5,
    historyDays: 365,
    priceMonthly: 99,
    priceYearly: 990,
    features: {
      csvExport: true,
      pdfExport: true,
      emailReports: false,
      apiAccess: false,
      prioritySupport: false,
    },
    isActive: true,
    createdAt: new Date(),
  };

  const mockUser = {
    id: mockUserId,
    email: 'test@test.com',
    password: 'hashed',
    name: 'Test User',
    planId: 'plan-free',
    grandfathered: false,
    plan: mockFreePlan,
  };

  const mockMembership = {
    id: 'member-123',
    companyId: mockCompanyId,
    userId: mockUserId,
    inviteStatus: InviteStatus.ACCEPTED,
    company: {
      id: mockCompanyId,
      stores: [{ id: 'store-1' }],
    },
  };

  const mockPrismaService = {
    plan: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    companyMember: {
      findMany: jest.fn(),
    },
  };

  const mockPricingService = {
    isPricingEnabled: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PlanService>(PlanService);
    prismaService = module.get<PrismaService>(PrismaService);
    pricingService = module.get<PricingService>(PricingService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('getAllPlans', () => {
    it('should return cached plans if available', async () => {
      const cachedPlans = [mockFreePlan, mockProPlan];
      mockCacheManager.get.mockResolvedValue(cachedPlans);

      const result = await service.getAllPlans();

      expect(result).toEqual(cachedPlans);
      expect(mockPrismaService.plan.findMany).not.toHaveBeenCalled();
    });

    it('should fetch plans from database if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plan.findMany.mockResolvedValue([mockFreePlan, mockProPlan]);

      const result = await service.getAllPlans();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.plan.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { priceMonthly: 'asc' },
      });
    });

    it('should cache fetched plans', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.plan.findMany.mockResolvedValue([mockFreePlan]);

      await service.getAllPlans();

      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getUserPlanInfo', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findMany.mockResolvedValue([mockMembership]);
    });

    it('should throw if user not found', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPlanInfo(mockUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return unlimited access when pricing is disabled', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(false);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.plan.findUnique.mockResolvedValue(mockFreePlan);

      const result = await service.getUserPlanInfo(mockUserId);

      expect(result.storeLimit).toBe(999);
      expect(result.canAddStore).toBe(true);
      expect(result.features.csvExport).toBe(true);
      expect(result.features.apiAccess).toBe(true);
    });

    it('should return unlimited access for grandfathered users', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        grandfathered: true,
      });

      const result = await service.getUserPlanInfo(mockUserId);

      expect(result.isGrandfathered).toBe(true);
      expect(result.storeLimit).toBe(999);
      expect(result.canAddStore).toBe(true);
    });

    it('should return plan limits when pricing is enabled', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getUserPlanInfo(mockUserId);

      expect(result.plan.name).toBe(PlanType.FREE);
      expect(result.storeLimit).toBe(2);
      expect(result.storeCount).toBe(1);
      expect(result.canAddStore).toBe(true);
    });

    it('should return canAddStore false when at limit', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.companyMember.findMany.mockResolvedValue([
        {
          ...mockMembership,
          company: {
            stores: [{ id: 'store-1' }, { id: 'store-2' }],
          },
        },
      ]);

      const result = await service.getUserPlanInfo(mockUserId);

      expect(result.canAddStore).toBe(false);
    });
  });

  describe('getUserUsage', () => {
    it('should return usage info', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.companyMember.findMany.mockResolvedValue([mockMembership]);

      const result = await service.getUserUsage(mockUserId);

      expect(result.storeCount).toBe(1);
      expect(result.storeLimit).toBe(2);
      expect(result.usagePercentage).toBe(50);
      expect(result.isAtLimit).toBe(false);
      expect(result.isNearLimit).toBe(false);
    });

    it('should detect near limit status', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        plan: { ...mockFreePlan, storeLimit: 5 },
      });
      mockPrismaService.companyMember.findMany.mockResolvedValue([
        {
          ...mockMembership,
          company: {
            stores: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
          },
        },
      ]);

      const result = await service.getUserUsage(mockUserId);

      expect(result.isNearLimit).toBe(true);
      expect(result.usagePercentage).toBe(80);
    });
  });

  describe('canAddStore', () => {
    it('should return true when user can add store', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.companyMember.findMany.mockResolvedValue([mockMembership]);

      const result = await service.canAddStore(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false when at limit', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.companyMember.findMany.mockResolvedValue([
        {
          ...mockMembership,
          company: {
            stores: [{ id: '1' }, { id: '2' }],
          },
        },
      ]);

      const result = await service.canAddStore(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('hasFeatureAccess', () => {
    it('should return true for available features', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        plan: mockProPlan,
      });
      mockPrismaService.companyMember.findMany.mockResolvedValue([mockMembership]);

      const result = await service.hasFeatureAccess(mockUserId, 'csvExport');

      expect(result).toBe(true);
    });

    it('should return false for unavailable features', async () => {
      mockPricingService.isPricingEnabled.mockResolvedValue(true);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.companyMember.findMany.mockResolvedValue([mockMembership]);

      const result = await service.hasFeatureAccess(mockUserId, 'csvExport');

      expect(result).toBe(false);
    });
  });

  describe('upgradePlan', () => {
    it('should upgrade user plan', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(mockProPlan);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        planId: mockProPlan.id,
      });

      const result = await service.upgradePlan(mockUserId, PlanType.PRO);

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { planId: mockProPlan.id },
      });
    });

    it('should return error if plan not found', async () => {
      mockPrismaService.plan.findUnique.mockResolvedValue(null);

      const result = await service.upgradePlan(mockUserId, PlanType.PRO);

      expect(result.success).toBe(false);
    });
  });

  describe('grandfatherExistingUsers', () => {
    it('should mark all users as grandfathered', async () => {
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 10 });

      const result = await service.grandfatherExistingUsers();

      expect(result).toBe(10);
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { grandfathered: false },
        data: { grandfathered: true },
      });
    });
  });
});
