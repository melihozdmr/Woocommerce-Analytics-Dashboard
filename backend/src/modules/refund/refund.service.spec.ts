import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RefundService } from './refund.service';
import { PrismaService } from '../../database/prisma.service';
import { InviteStatus } from '@prisma/client';

describe('RefundService', () => {
  let service: RefundService;
  let prismaService: PrismaService;
  let cacheManager: any;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockStoreId = 'store-123';

  const mockStore = {
    id: mockStoreId,
    name: 'Test Store',
  };

  const mockMembership = {
    id: 'member-123',
    companyId: mockCompanyId,
    userId: mockUserId,
    inviteStatus: InviteStatus.ACCEPTED,
  };

  const mockRefund = {
    id: 'refund-123',
    orderId: 'order-123',
    wcRefundId: 1,
    amount: 150,
    reason: 'Ürün hasarlı',
    refundDate: new Date('2025-01-15'),
    order: {
      id: 'order-123',
      orderNumber: '#1001',
      total: 300,
      customerName: 'Test Customer',
      storeId: mockStoreId,
    },
  };

  const mockPrismaService = {
    companyMember: {
      findFirst: jest.fn(),
    },
    store: {
      findMany: jest.fn(),
    },
    refund: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundService,
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

    service = module.get<RefundService>(RefundService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe('checkCompanyAccess', () => {
    it('should throw ForbiddenException if user has no access', async () => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.getRefundSummary(mockCompanyId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access if user is a member', async () => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockPrismaService.refund.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getRefundSummary(mockCompanyId, mockUserId);

      expect(result).toBeDefined();
    });
  });

  describe('getRefundSummary', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should return cached data if available', async () => {
      const cachedData = {
        totalRefunds: 10,
        totalRefundAmount: 1500,
        refundRate: 5,
      };
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getRefundSummary(mockCompanyId, mockUserId);

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.refund.findMany).not.toHaveBeenCalled();
    });

    it('should calculate refund summary correctly', async () => {
      mockPrismaService.refund.findMany
        .mockResolvedValueOnce([mockRefund]) // Current period
        .mockResolvedValueOnce([]); // Previous period
      mockPrismaService.order.count.mockResolvedValue(20);

      const result = await service.getRefundSummary(mockCompanyId, mockUserId);

      expect(result.totalRefunds).toBe(1);
      expect(result.totalRefundAmount).toBe(150);
      expect(result.refundRate).toBe(5); // 1/20 * 100 = 5%
      expect(result.totalOrders).toBe(20);
      expect(result.avgRefundAmount).toBe(150);
    });

    it('should handle zero orders', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      const result = await service.getRefundSummary(mockCompanyId, mockUserId);

      expect(result.refundRate).toBe(0);
      expect(result.avgRefundAmount).toBe(0);
    });

    it('should calculate percentage change', async () => {
      const currentRefunds = [{ ...mockRefund, amount: 200 }];
      const previousRefunds = [{ ...mockRefund, amount: 100 }];

      mockPrismaService.refund.findMany
        .mockResolvedValueOnce(currentRefunds)
        .mockResolvedValueOnce(previousRefunds);
      mockPrismaService.order.count.mockResolvedValue(10);

      const result = await service.getRefundSummary(mockCompanyId, mockUserId);

      expect(result.refundCountChange).toBeDefined();
      expect(result.refundAmountChange).toBeDefined();
    });

    it('should cache the result', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.getRefundSummary(mockCompanyId, mockUserId);

      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getRefundList', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
    });

    it('should return paginated refund list', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([mockRefund]);
      mockPrismaService.refund.count.mockResolvedValue(1);

      const result = await service.getRefundList(mockCompanyId, mockUserId);

      expect(result.refunds).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should map refund data correctly', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([mockRefund]);
      mockPrismaService.refund.count.mockResolvedValue(1);

      const result = await service.getRefundList(mockCompanyId, mockUserId);

      expect(result.refunds[0].orderNumber).toBe('#1001');
      expect(result.refunds[0].amount).toBe(150);
      expect(result.refunds[0].reason).toBe('Ürün hasarlı');
      expect(result.refunds[0].storeName).toBe('Test Store');
    });

    it('should handle pagination', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([]);
      mockPrismaService.refund.count.mockResolvedValue(50);

      const result = await service.getRefundList(
        mockCompanyId,
        mockUserId,
        '30d',
        undefined,
        undefined,
        undefined,
        2,
        20,
      );

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('getRefundReasons', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should group refunds by reason', async () => {
      const refunds = [
        { reason: 'Ürün hasarlı', amount: 100 },
        { reason: 'Ürün hasarlı', amount: 150 },
        { reason: 'Yanlış ürün', amount: 200 },
      ];
      mockPrismaService.refund.findMany.mockResolvedValue(refunds);

      const result = await service.getRefundReasons(mockCompanyId, mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0].reason).toBe('Ürün hasarlı');
      expect(result[0].count).toBe(2);
      expect(result[0].totalAmount).toBe(250);
    });

    it('should handle null reasons', async () => {
      const refunds = [
        { reason: null, amount: 100 },
        { reason: 'Ürün hasarlı', amount: 150 },
      ];
      mockPrismaService.refund.findMany.mockResolvedValue(refunds);

      const result = await service.getRefundReasons(mockCompanyId, mockUserId);

      expect(result.some((r) => r.reason === 'Belirtilmemiş')).toBe(true);
    });

    it('should calculate percentages', async () => {
      const refunds = [
        { reason: 'Reason A', amount: 100 },
        { reason: 'Reason A', amount: 100 },
        { reason: 'Reason A', amount: 100 },
        { reason: 'Reason B', amount: 100 },
      ];
      mockPrismaService.refund.findMany.mockResolvedValue(refunds);

      const result = await service.getRefundReasons(mockCompanyId, mockUserId);

      expect(result[0].percentage).toBe(75); // 3/4 * 100
      expect(result[1].percentage).toBe(25); // 1/4 * 100
    });

    it('should sort by count descending', async () => {
      const refunds = [
        { reason: 'Reason A', amount: 100 },
        { reason: 'Reason B', amount: 100 },
        { reason: 'Reason B', amount: 100 },
        { reason: 'Reason B', amount: 100 },
      ];
      mockPrismaService.refund.findMany.mockResolvedValue(refunds);

      const result = await service.getRefundReasons(mockCompanyId, mockUserId);

      expect(result[0].reason).toBe('Reason B');
      expect(result[0].count).toBe(3);
    });
  });

  describe('getRefundTrend', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should return cached data if available', async () => {
      const cachedData = [{ date: '2025-01-15', count: 5 }];
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getRefundTrend(mockCompanyId, mockUserId);

      expect(result).toEqual(cachedData);
    });

    it('should return trend data with all dates', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([]);

      const result = await service.getRefundTrend(mockCompanyId, mockUserId, '7d');

      expect(result.length).toBeGreaterThanOrEqual(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('count');
      expect(result[0]).toHaveProperty('amount');
    });

    it('should cache the result', async () => {
      mockPrismaService.refund.findMany.mockResolvedValue([]);

      await service.getRefundTrend(mockCompanyId, mockUserId);

      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getStoreComparison', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([
        { id: 'store-1', name: 'Store A' },
        { id: 'store-2', name: 'Store B' },
      ]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should return store comparison data', async () => {
      mockPrismaService.refund.findMany
        .mockResolvedValueOnce([{ amount: 100 }, { amount: 200 }]) // Store A
        .mockResolvedValueOnce([{ amount: 50 }]); // Store B
      mockPrismaService.order.count
        .mockResolvedValueOnce(20) // Store A
        .mockResolvedValueOnce(10); // Store B

      const result = await service.getStoreComparison(mockCompanyId, mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('storeName');
      expect(result[0]).toHaveProperty('refundCount');
      expect(result[0]).toHaveProperty('refundAmount');
      expect(result[0]).toHaveProperty('refundRate');
    });

    it('should calculate refund rate per store', async () => {
      mockPrismaService.refund.findMany
        .mockResolvedValueOnce([{ amount: 100 }]) // Store A - 1 refund
        .mockResolvedValueOnce([{ amount: 50 }, { amount: 50 }]); // Store B - 2 refunds
      mockPrismaService.order.count
        .mockResolvedValueOnce(10) // Store A - 10 orders
        .mockResolvedValueOnce(20); // Store B - 20 orders

      const result = await service.getStoreComparison(mockCompanyId, mockUserId);

      // Store A: 1/10 = 10%, Store B: 2/20 = 10%
      expect(result[0].refundRate).toBeDefined();
    });

    it('should sort by refund rate descending', async () => {
      mockPrismaService.refund.findMany
        .mockResolvedValueOnce([{ amount: 100 }]) // Store A - 1 refund
        .mockResolvedValueOnce([{ amount: 50 }, { amount: 50 }, { amount: 50 }]); // Store B - 3 refunds
      mockPrismaService.order.count
        .mockResolvedValueOnce(100) // Store A - 1% rate
        .mockResolvedValueOnce(10); // Store B - 30% rate

      const result = await service.getStoreComparison(mockCompanyId, mockUserId);

      expect(result[0].refundRate).toBeGreaterThan(result[1].refundRate);
    });
  });

  describe('date range handling', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockPrismaService.refund.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should handle today period', async () => {
      await service.getRefundSummary(mockCompanyId, mockUserId, 'today');

      expect(mockPrismaService.refund.findMany).toHaveBeenCalled();
    });

    it('should handle custom date range', async () => {
      await service.getRefundSummary(
        mockCompanyId,
        mockUserId,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
      );

      expect(mockPrismaService.refund.findMany).toHaveBeenCalled();
    });
  });

  describe('store filtering', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([
        mockStore,
        { id: 'store-456', name: 'Store 2' },
      ]);
      mockPrismaService.refund.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should filter by specific store', async () => {
      await service.getRefundSummary(mockCompanyId, mockUserId, '30d', mockStoreId);

      const call = mockPrismaService.refund.findMany.mock.calls[0][0];
      expect(call.where.order.storeId.in).toEqual([mockStoreId]);
    });

    it('should use all stores if no store filter', async () => {
      await service.getRefundSummary(mockCompanyId, mockUserId);

      const call = mockPrismaService.refund.findMany.mock.calls[0][0];
      expect(call.where.order.storeId.in).toHaveLength(2);
    });
  });
});
