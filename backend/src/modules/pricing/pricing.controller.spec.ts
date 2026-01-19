import { Test, TestingModule } from '@nestjs/testing';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { PlanService } from './plan.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanType } from '@prisma/client';

describe('PricingController', () => {
  let controller: PricingController;
  let pricingService: PricingService;
  let planService: PlanService;

  const mockUserId = 'user-123';
  const mockRequest = { user: { sub: mockUserId } };

  const mockPlans = [
    {
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
    },
    {
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
    },
  ];

  const mockUserPlanInfo = {
    plan: mockPlans[0],
    isGrandfathered: false,
    storeCount: 1,
    storeLimit: 2,
    canAddStore: true,
    features: mockPlans[0].features,
  };

  const mockUsageInfo = {
    storeCount: 1,
    storeLimit: 2,
    usagePercentage: 50,
    isAtLimit: false,
    isNearLimit: false,
  };

  const mockPricingService = {
    getPricingStatus: jest.fn(),
    togglePricing: jest.fn(),
  };

  const mockPlanService = {
    getAllPlans: jest.fn(),
    getUserPlanInfo: jest.fn(),
    getUserUsage: jest.fn(),
    upgradePlan: jest.fn(),
    grandfatherExistingUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PricingController],
      providers: [
        {
          provide: PricingService,
          useValue: mockPricingService,
        },
        {
          provide: PlanService,
          useValue: mockPlanService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PricingController>(PricingController);
    pricingService = module.get<PricingService>(PricingService);
    planService = module.get<PlanService>(PlanService);

    jest.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should return all plans', async () => {
      mockPlanService.getAllPlans.mockResolvedValue(mockPlans);

      const result = await controller.getPlans();

      expect(result).toEqual({ plans: mockPlans });
      expect(mockPlanService.getAllPlans).toHaveBeenCalled();
    });
  });

  describe('getPricingStatus', () => {
    it('should return pricing status', async () => {
      mockPricingService.getPricingStatus.mockResolvedValue({ enabled: true });

      const result = await controller.getPricingStatus();

      expect(result).toEqual({ enabled: true });
    });
  });

  describe('getMyPlan', () => {
    it('should return user plan info', async () => {
      mockPlanService.getUserPlanInfo.mockResolvedValue(mockUserPlanInfo);

      const result = await controller.getMyPlan(mockRequest);

      expect(result.plan.name).toBe(PlanType.FREE);
      expect(result.isGrandfathered).toBe(false);
      expect(result.features).toBeDefined();
      expect(mockPlanService.getUserPlanInfo).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('getUsage', () => {
    it('should return usage info', async () => {
      mockPlanService.getUserUsage.mockResolvedValue(mockUsageInfo);

      const result = await controller.getUsage(mockRequest);

      expect(result).toEqual(mockUsageInfo);
      expect(mockPlanService.getUserUsage).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('requestUpgrade', () => {
    it('should upgrade plan', async () => {
      mockPlanService.upgradePlan.mockResolvedValue({
        success: true,
        message: 'Plan upgraded',
      });

      const result = await controller.requestUpgrade(mockRequest, {
        planType: PlanType.PRO,
      });

      expect(result.success).toBe(true);
      expect(mockPlanService.upgradePlan).toHaveBeenCalledWith(
        mockUserId,
        PlanType.PRO,
      );
    });
  });

  describe('togglePricing', () => {
    it('should toggle pricing on', async () => {
      mockPricingService.togglePricing.mockResolvedValue(true);

      const result = await controller.togglePricing({ enabled: true });

      expect(result).toEqual({ enabled: true });
      expect(mockPricingService.togglePricing).toHaveBeenCalledWith(true);
    });

    it('should toggle pricing off', async () => {
      mockPricingService.togglePricing.mockResolvedValue(false);

      const result = await controller.togglePricing({ enabled: false });

      expect(result).toEqual({ enabled: false });
    });
  });

  describe('grandfatherUsers', () => {
    it('should grandfather existing users', async () => {
      mockPlanService.grandfatherExistingUsers.mockResolvedValue(10);

      const result = await controller.grandfatherUsers();

      expect(result.success).toBe(true);
      expect(result.count).toBe(10);
    });
  });
});
