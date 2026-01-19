import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PricingService } from './pricing.service';
import { PrismaService } from '../../database/prisma.service';

describe('PricingService', () => {
  let service: PricingService;
  let prismaService: PrismaService;
  let cacheManager: any;

  const mockPrismaService = {
    setting: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('isPricingEnabled', () => {
    it('should return cached value if available', async () => {
      mockCacheManager.get.mockResolvedValue(true);

      const result = await service.isPricingEnabled();

      expect(result).toBe(true);
      expect(mockPrismaService.setting.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.setting.findUnique.mockResolvedValue({
        key: 'pricing_enabled',
        value: 'true',
      });

      const result = await service.isPricingEnabled();

      expect(result).toBe(true);
      expect(mockPrismaService.setting.findUnique).toHaveBeenCalledWith({
        where: { key: 'pricing_enabled' },
      });
    });

    it('should cache the database result', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.setting.findUnique.mockResolvedValue({
        key: 'pricing_enabled',
        value: 'false',
      });

      await service.isPricingEnabled();

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        'pricing:enabled',
        false,
        expect.any(Number),
      );
    });

    it('should return false if setting not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.setting.findUnique.mockResolvedValue(null);

      const result = await service.isPricingEnabled();

      expect(result).toBe(false);
    });
  });

  describe('togglePricing', () => {
    it('should enable pricing', async () => {
      mockPrismaService.setting.upsert.mockResolvedValue({
        key: 'pricing_enabled',
        value: 'true',
      });

      const result = await service.togglePricing(true);

      expect(result).toBe(true);
      expect(mockPrismaService.setting.upsert).toHaveBeenCalledWith({
        where: { key: 'pricing_enabled' },
        update: { value: 'true' },
        create: { key: 'pricing_enabled', value: 'true' },
      });
    });

    it('should disable pricing', async () => {
      mockPrismaService.setting.upsert.mockResolvedValue({
        key: 'pricing_enabled',
        value: 'false',
      });

      const result = await service.togglePricing(false);

      expect(result).toBe(false);
    });

    it('should invalidate cache after toggle', async () => {
      mockPrismaService.setting.upsert.mockResolvedValue({});

      await service.togglePricing(true);

      expect(mockCacheManager.del).toHaveBeenCalledWith('pricing:enabled');
    });
  });

  describe('getPricingStatus', () => {
    it('should return pricing status object', async () => {
      mockCacheManager.get.mockResolvedValue(true);

      const result = await service.getPricingStatus();

      expect(result).toEqual({ enabled: true });
    });
  });
});
