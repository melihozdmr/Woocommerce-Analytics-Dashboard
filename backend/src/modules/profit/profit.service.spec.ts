import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProfitService } from './profit.service';
import { PrismaService } from '../../database/prisma.service';
import { InviteStatus } from '@prisma/client';

describe('ProfitService', () => {
  let service: ProfitService;
  let prismaService: PrismaService;
  let cacheManager: any;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockStoreId = 'store-123';

  const mockStore = {
    id: mockStoreId,
    name: 'Test Store',
    commissionRate: 10, // 10%
    shippingCost: 15,
  };

  const mockMembership = {
    id: 'member-123',
    companyId: mockCompanyId,
    userId: mockUserId,
    inviteStatus: InviteStatus.ACCEPTED,
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: '#1001',
    storeId: mockStoreId,
    status: 'completed',
    orderDate: new Date('2025-01-15'),
    total: 299,
    customerName: 'Test Customer',
    itemsCount: 2,
    store: mockStore,
    items: [
      {
        id: 'item-1',
        quantity: 2,
        total: 299,
        product: {
          id: 'product-1',
          name: 'Test Product',
          sku: 'SKU-001',
          imageUrl: null,
          price: 149.5,
          purchasePrice: 60,
          storeId: mockStoreId,
        },
        order: { storeId: mockStoreId },
      },
    ],
  };

  const mockPrismaService = {
    companyMember: {
      findFirst: jest.fn(),
    },
    store: {
      findMany: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    orderItem: {
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfitService,
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

    service = module.get<ProfitService>(ProfitService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('checkCompanyAccess', () => {
    it('should throw ForbiddenException if user has no access', async () => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.getProfitSummary(mockCompanyId, mockUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access if user is a member', async () => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(result).toBeDefined();
      expect(mockPrismaService.companyMember.findFirst).toHaveBeenCalledWith({
        where: {
          companyId: mockCompanyId,
          userId: mockUserId,
          inviteStatus: InviteStatus.ACCEPTED,
        },
      });
    });
  });

  describe('getProfitSummary', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should return cached data if available', async () => {
      const cachedData = {
        totalRevenue: 1000,
        netProfit: 500,
      };
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.order.findMany).not.toHaveBeenCalled();
    });

    it('should calculate profit summary correctly', async () => {
      const orders = [
        {
          ...mockOrder,
          total: 299,
          items: [
            {
              quantity: 2,
              product: { purchasePrice: 60 },
            },
          ],
        },
      ];

      mockPrismaService.order.findMany
        .mockResolvedValueOnce(orders) // Current period
        .mockResolvedValueOnce([]); // Previous period

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      // Revenue: 299
      // Cost: 60 * 2 = 120
      // Gross Profit: 299 - 120 = 179
      // Commission: 299 * 0.10 = 29.9
      // Shipping: 15
      // Net Profit: 179 - 29.9 - 15 = 134.1

      expect(result.totalRevenue).toBe(299);
      expect(result.totalCost).toBe(120);
      expect(result.grossProfit).toBe(179);
      expect(result.totalCommission).toBe(29.9);
      expect(result.totalShippingCost).toBe(15);
      expect(result.netProfit).toBe(134.1);
      expect(result.ordersCount).toBe(1);
      expect(result.itemsCount).toBe(2);
    });

    it('should calculate profit margin correctly', async () => {
      const orders = [
        {
          ...mockOrder,
          total: 1000,
          items: [
            {
              quantity: 1,
              product: { purchasePrice: 400 },
            },
          ],
        },
      ];

      mockPrismaService.order.findMany
        .mockResolvedValueOnce(orders)
        .mockResolvedValueOnce([]);

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      // Revenue: 1000
      // Cost: 400
      // Gross: 600
      // Commission: 100
      // Shipping: 15
      // Net: 485
      // Margin: (485 / 1000) * 100 = 48.5%

      expect(result.profitMargin).toBe(48.5);
    });

    it('should handle orders without purchase price', async () => {
      const orders = [
        {
          ...mockOrder,
          total: 500,
          items: [
            {
              quantity: 1,
              product: { purchasePrice: null },
            },
          ],
        },
      ];

      mockPrismaService.order.findMany
        .mockResolvedValueOnce(orders)
        .mockResolvedValueOnce([]);

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(result.totalCost).toBe(0);
      expect(result.grossProfit).toBe(500);
    });

    it('should calculate profit change percentage', async () => {
      const currentOrders = [
        {
          ...mockOrder,
          total: 1000,
          items: [{ quantity: 1, product: { purchasePrice: 400 } }],
        },
      ];

      const previousOrders = [
        {
          ...mockOrder,
          total: 500,
          items: [{ quantity: 1, product: { purchasePrice: 200 } }],
        },
      ];

      mockPrismaService.order.findMany
        .mockResolvedValueOnce(currentOrders)
        .mockResolvedValueOnce(previousOrders);

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(result.profitChange).toBeDefined();
      expect(typeof result.profitChange).toBe('number');
    });

    it('should cache the result', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('getProductProfits', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
    });

    it('should return product profits sorted by net profit', async () => {
      const orderItems = [
        {
          quantity: 5,
          total: 500,
          product: {
            id: 'prod-1',
            name: 'Product A',
            sku: 'SKU-A',
            imageUrl: null,
            price: 100,
            purchasePrice: 40,
            storeId: mockStoreId,
          },
          order: { storeId: mockStoreId },
        },
        {
          quantity: 3,
          total: 600,
          product: {
            id: 'prod-2',
            name: 'Product B',
            sku: 'SKU-B',
            imageUrl: null,
            price: 200,
            purchasePrice: 80,
            storeId: mockStoreId,
          },
          order: { storeId: mockStoreId },
        },
      ];

      mockPrismaService.orderItem.findMany.mockResolvedValue(orderItems);

      const result = await service.getProductProfits(mockCompanyId, mockUserId);

      expect(result.length).toBe(2);
      // Should be sorted by net profit descending
      expect(result[0].netProfit).toBeGreaterThanOrEqual(result[1].netProfit);
    });

    it('should calculate product profit correctly', async () => {
      const orderItems = [
        {
          quantity: 2,
          total: 200,
          product: {
            id: 'prod-1',
            name: 'Product A',
            sku: 'SKU-A',
            imageUrl: null,
            price: 100,
            purchasePrice: 40,
            storeId: mockStoreId,
          },
          order: { storeId: mockStoreId },
        },
      ];

      mockPrismaService.orderItem.findMany.mockResolvedValue(orderItems);

      const result = await service.getProductProfits(mockCompanyId, mockUserId);

      expect(result.length).toBe(1);
      expect(result[0].productName).toBe('Product A');
      expect(result[0].quantitySold).toBe(2);
      expect(result[0].totalRevenue).toBe(200);
      expect(result[0].totalCost).toBe(80); // 40 * 2
      expect(result[0].grossProfit).toBe(120); // 200 - 80
      expect(result[0].hasPurchasePrice).toBe(true);
    });

    it('should aggregate same product from multiple orders', async () => {
      const orderItems = [
        {
          quantity: 2,
          total: 200,
          product: {
            id: 'prod-1',
            name: 'Product A',
            sku: 'SKU-A',
            imageUrl: null,
            price: 100,
            purchasePrice: 40,
            storeId: mockStoreId,
          },
          order: { storeId: mockStoreId },
        },
        {
          quantity: 3,
          total: 300,
          product: {
            id: 'prod-1',
            name: 'Product A',
            sku: 'SKU-A',
            imageUrl: null,
            price: 100,
            purchasePrice: 40,
            storeId: mockStoreId,
          },
          order: { storeId: mockStoreId },
        },
      ];

      mockPrismaService.orderItem.findMany.mockResolvedValue(orderItems);

      const result = await service.getProductProfits(mockCompanyId, mockUserId);

      expect(result.length).toBe(1);
      expect(result[0].quantitySold).toBe(5); // 2 + 3
      expect(result[0].totalRevenue).toBe(500); // 200 + 300
      expect(result[0].totalCost).toBe(200); // 40 * 5
    });

    it('should respect limit parameter', async () => {
      const orderItems = Array.from({ length: 10 }, (_, i) => ({
        quantity: 1,
        total: 100,
        product: {
          id: `prod-${i}`,
          name: `Product ${i}`,
          sku: `SKU-${i}`,
          imageUrl: null,
          price: 100,
          purchasePrice: 50,
          storeId: mockStoreId,
        },
        order: { storeId: mockStoreId },
      }));

      mockPrismaService.orderItem.findMany.mockResolvedValue(orderItems);

      const result = await service.getProductProfits(
        mockCompanyId,
        mockUserId,
        '30d',
        undefined,
        undefined,
        undefined,
        5,
      );

      expect(result.length).toBe(5);
    });
  });

  describe('getOrderProfits', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
    });

    it('should return paginated order profits', async () => {
      const orders = [mockOrder];
      mockPrismaService.order.findMany.mockResolvedValue(orders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getOrderProfits(mockCompanyId, mockUserId);

      expect(result.orders.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should calculate order profit correctly', async () => {
      const orders = [
        {
          id: 'order-1',
          orderNumber: '#1001',
          storeId: mockStoreId,
          orderDate: new Date(),
          customerName: 'Customer',
          itemsCount: 2,
          total: 500,
          store: mockStore,
          items: [
            { quantity: 2, product: { purchasePrice: 100 } },
          ],
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(orders);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.getOrderProfits(mockCompanyId, mockUserId);

      // Revenue: 500
      // Cost: 100 * 2 = 200
      // Gross: 300
      // Commission: 500 * 0.10 = 50
      // Shipping: 15
      // Net: 300 - 50 - 15 = 235

      expect(result.orders[0].revenue).toBe(500);
      expect(result.orders[0].cost).toBe(200);
      expect(result.orders[0].grossProfit).toBe(300);
      expect(result.orders[0].commission).toBe(50);
      expect(result.orders[0].shippingCost).toBe(15);
      expect(result.orders[0].netProfit).toBe(235);
    });

    it('should handle pagination', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(50);

      const result = await service.getOrderProfits(
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

  describe('getProfitTrend', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should return cached data if available', async () => {
      const cachedData = [{ date: '2025-01-15', revenue: 1000 }];
      mockCacheManager.get.mockResolvedValue(cachedData);

      const result = await service.getProfitTrend(mockCompanyId, mockUserId);

      expect(result).toEqual(cachedData);
    });

    it('should return trend data grouped by date', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      const result = await service.getProfitTrend(
        mockCompanyId,
        mockUserId,
        '7d',
      );

      // Should have 7 days of data
      expect(result.length).toBeGreaterThanOrEqual(7);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('revenue');
      expect(result[0]).toHaveProperty('cost');
      expect(result[0]).toHaveProperty('grossProfit');
      expect(result[0]).toHaveProperty('netProfit');
    });

    it('should calculate daily profits correctly', async () => {
      const today = new Date();
      const orders = [
        {
          ...mockOrder,
          orderDate: today,
          total: 500,
          items: [{ quantity: 2, product: { purchasePrice: 100 } }],
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(orders);

      const result = await service.getProfitTrend(
        mockCompanyId,
        mockUserId,
        'today',
      );

      // Find today's entry
      const todayEntry = result.find((r) => {
        const entryDate = new Date(r.date);
        return entryDate.toDateString() === today.toDateString();
      });

      if (todayEntry) {
        expect(todayEntry.revenue).toBe(500);
        expect(todayEntry.cost).toBe(200);
        expect(todayEntry.grossProfit).toBe(300);
      }
    });

    it('should cache the trend result', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);

      await service.getProfitTrend(mockCompanyId, mockUserId);

      expect(mockCacheManager.set).toHaveBeenCalled();
    });
  });

  describe('calculatePercentageChange', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should return 100% if previous value is 0 and current is positive', async () => {
      mockPrismaService.order.findMany
        .mockResolvedValueOnce([
          {
            ...mockOrder,
            total: 100,
            items: [{ quantity: 1, product: { purchasePrice: 0 } }],
          },
        ])
        .mockResolvedValueOnce([]); // No previous orders

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(result.profitChange).toBe(100);
    });

    it('should calculate negative change correctly', async () => {
      const currentOrders = [
        {
          ...mockOrder,
          total: 100,
          items: [{ quantity: 1, product: { purchasePrice: 50 } }],
        },
      ];

      const previousOrders = [
        {
          ...mockOrder,
          total: 200,
          items: [{ quantity: 1, product: { purchasePrice: 50 } }],
        },
      ];

      mockPrismaService.order.findMany
        .mockResolvedValueOnce(currentOrders)
        .mockResolvedValueOnce(previousOrders);

      const result = await service.getProfitSummary(mockCompanyId, mockUserId);

      expect(result.profitChange).toBeLessThan(0);
    });
  });

  describe('getDateRange', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([mockStore]);
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should handle today period', async () => {
      await service.getProfitSummary(mockCompanyId, mockUserId, 'today');

      const call = mockPrismaService.order.findMany.mock.calls[0][0];
      const { gte, lte } = call.where.orderDate;

      expect(gte.toDateString()).toBe(new Date().toDateString());
      expect(lte.toDateString()).toBe(new Date().toDateString());
    });

    it('should handle custom date range', async () => {
      const startDate = '2025-01-01';
      const endDate = '2025-01-15';

      await service.getProfitSummary(
        mockCompanyId,
        mockUserId,
        'custom',
        undefined,
        startDate,
        endDate,
      );

      const call = mockPrismaService.order.findMany.mock.calls[0][0];
      const { gte, lte } = call.where.orderDate;

      // Check year and month are correct (timezone-independent)
      expect(gte.getFullYear()).toBe(2025);
      expect(gte.getMonth()).toBe(0); // January
      expect(gte.getDate()).toBe(1);

      expect(lte.getFullYear()).toBe(2025);
      expect(lte.getMonth()).toBe(0); // January
      expect(lte.getDate()).toBe(15);
    });
  });

  describe('store filtering', () => {
    beforeEach(() => {
      mockPrismaService.companyMember.findFirst.mockResolvedValue(mockMembership);
      mockPrismaService.store.findMany.mockResolvedValue([
        mockStore,
        { ...mockStore, id: 'store-456', name: 'Store 2' },
      ]);
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockCacheManager.get.mockResolvedValue(null);
    });

    it('should filter by specific store', async () => {
      await service.getProfitSummary(mockCompanyId, mockUserId, '30d', mockStoreId);

      const call = mockPrismaService.order.findMany.mock.calls[0][0];

      expect(call.where.storeId.in).toEqual([mockStoreId]);
    });

    it('should use all stores if no store filter', async () => {
      await service.getProfitSummary(mockCompanyId, mockUserId);

      const call = mockPrismaService.order.findMany.mock.calls[0][0];

      expect(call.where.storeId.in).toHaveLength(2);
    });
  });
});
