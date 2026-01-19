import { Test, TestingModule } from '@nestjs/testing';
import { ProfitController } from './profit.controller';
import { ProfitService } from './profit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('ProfitController', () => {
  let controller: ProfitController;
  let profitService: ProfitService;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockRequest = { user: { sub: mockUserId } };

  const mockProfitSummary = {
    totalRevenue: 10000,
    totalCost: 4000,
    totalCommission: 1000,
    totalShippingCost: 300,
    grossProfit: 6000,
    netProfit: 4700,
    profitMargin: 47,
    ordersCount: 50,
    itemsCount: 120,
    avgOrderProfit: 94,
    previousNetProfit: 4000,
    profitChange: 17.5,
  };

  const mockProductProfits = [
    {
      productId: 'prod-1',
      productName: 'Product A',
      sku: 'SKU-A',
      imageUrl: null,
      salePrice: 100,
      purchasePrice: 40,
      quantitySold: 50,
      totalRevenue: 5000,
      totalCost: 2000,
      grossProfit: 3000,
      netProfit: 2400,
      profitMargin: 48,
      hasPurchasePrice: true,
    },
  ];

  const mockOrderProfits = {
    orders: [
      {
        orderId: 'order-1',
        orderNumber: '#1001',
        orderDate: new Date(),
        storeName: 'Test Store',
        customerName: 'Test Customer',
        itemsCount: 2,
        revenue: 200,
        cost: 80,
        commission: 20,
        shippingCost: 15,
        grossProfit: 120,
        netProfit: 85,
        profitMargin: 42.5,
      },
    ],
    total: 1,
    page: 1,
    totalPages: 1,
  };

  const mockProfitTrend = [
    {
      date: '2025-01-15',
      revenue: 1000,
      cost: 400,
      grossProfit: 600,
      netProfit: 485,
    },
  ];

  const mockProfitService = {
    getProfitSummary: jest.fn(),
    getProductProfits: jest.fn(),
    getOrderProfits: jest.fn(),
    getProfitTrend: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfitController],
      providers: [
        {
          provide: ProfitService,
          useValue: mockProfitService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProfitController>(ProfitController);
    profitService = module.get<ProfitService>(ProfitService);

    jest.clearAllMocks();
  });

  describe('getProfitSummary', () => {
    it('should return profit summary', async () => {
      mockProfitService.getProfitSummary.mockResolvedValue(mockProfitSummary);

      const result = await controller.getProfitSummary(
        mockCompanyId,
        mockRequest,
      );

      expect(result).toEqual(mockProfitSummary);
      expect(mockProfitService.getProfitSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass period filter', async () => {
      mockProfitService.getProfitSummary.mockResolvedValue(mockProfitSummary);

      await controller.getProfitSummary(
        mockCompanyId,
        mockRequest,
        '7d',
      );

      expect(mockProfitService.getProfitSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass store filter', async () => {
      mockProfitService.getProfitSummary.mockResolvedValue(mockProfitSummary);
      const storeId = 'store-123';

      await controller.getProfitSummary(
        mockCompanyId,
        mockRequest,
        '30d',
        storeId,
      );

      expect(mockProfitService.getProfitSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '30d',
        storeId,
        undefined,
        undefined,
      );
    });

    it('should pass custom date range', async () => {
      mockProfitService.getProfitSummary.mockResolvedValue(mockProfitSummary);
      const startDate = '2025-01-01';
      const endDate = '2025-01-15';

      await controller.getProfitSummary(
        mockCompanyId,
        mockRequest,
        'custom',
        undefined,
        startDate,
        endDate,
      );

      expect(mockProfitService.getProfitSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        'custom',
        undefined,
        startDate,
        endDate,
      );
    });
  });

  describe('getProductProfits', () => {
    it('should return product profits', async () => {
      mockProfitService.getProductProfits.mockResolvedValue(mockProductProfits);

      const result = await controller.getProductProfits(
        mockCompanyId,
        mockRequest,
      );

      expect(result).toEqual(mockProductProfits);
      expect(mockProfitService.getProductProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass limit parameter', async () => {
      mockProfitService.getProductProfits.mockResolvedValue(mockProductProfits);

      await controller.getProductProfits(
        mockCompanyId,
        mockRequest,
        '30d',
        undefined,
        undefined,
        undefined,
        '10',
      );

      expect(mockProfitService.getProductProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '30d',
        undefined,
        undefined,
        undefined,
        10,
      );
    });

    it('should pass all filters', async () => {
      mockProfitService.getProductProfits.mockResolvedValue(mockProductProfits);
      const storeId = 'store-123';

      await controller.getProductProfits(
        mockCompanyId,
        mockRequest,
        '7d',
        storeId,
        undefined,
        undefined,
        '25',
      );

      expect(mockProfitService.getProductProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        storeId,
        undefined,
        undefined,
        25,
      );
    });
  });

  describe('getOrderProfits', () => {
    it('should return paginated order profits', async () => {
      mockProfitService.getOrderProfits.mockResolvedValue(mockOrderProfits);

      const result = await controller.getOrderProfits(
        mockCompanyId,
        mockRequest,
      );

      expect(result).toEqual(mockOrderProfits);
      expect(mockProfitService.getOrderProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass pagination parameters', async () => {
      mockProfitService.getOrderProfits.mockResolvedValue(mockOrderProfits);

      await controller.getOrderProfits(
        mockCompanyId,
        mockRequest,
        '30d',
        undefined,
        undefined,
        undefined,
        '2',
        '20',
      );

      expect(mockProfitService.getOrderProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '30d',
        undefined,
        undefined,
        undefined,
        2,
        20,
      );
    });

    it('should pass store and period filters', async () => {
      mockProfitService.getOrderProfits.mockResolvedValue(mockOrderProfits);
      const storeId = 'store-123';

      await controller.getOrderProfits(
        mockCompanyId,
        mockRequest,
        '7d',
        storeId,
      );

      expect(mockProfitService.getOrderProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        storeId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass custom date range', async () => {
      mockProfitService.getOrderProfits.mockResolvedValue(mockOrderProfits);

      await controller.getOrderProfits(
        mockCompanyId,
        mockRequest,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
      );

      expect(mockProfitService.getOrderProfits).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
        undefined,
        undefined,
      );
    });
  });

  describe('getProfitTrend', () => {
    it('should return profit trend', async () => {
      mockProfitService.getProfitTrend.mockResolvedValue(mockProfitTrend);

      const result = await controller.getProfitTrend(
        mockCompanyId,
        mockRequest,
      );

      expect(result).toEqual(mockProfitTrend);
      expect(mockProfitService.getProfitTrend).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass period filter', async () => {
      mockProfitService.getProfitTrend.mockResolvedValue(mockProfitTrend);

      await controller.getProfitTrend(
        mockCompanyId,
        mockRequest,
        '7d',
      );

      expect(mockProfitService.getProfitTrend).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass store filter', async () => {
      mockProfitService.getProfitTrend.mockResolvedValue(mockProfitTrend);
      const storeId = 'store-123';

      await controller.getProfitTrend(
        mockCompanyId,
        mockRequest,
        '30d',
        storeId,
      );

      expect(mockProfitService.getProfitTrend).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '30d',
        storeId,
        undefined,
        undefined,
      );
    });

    it('should pass custom date range', async () => {
      mockProfitService.getProfitTrend.mockResolvedValue(mockProfitTrend);

      await controller.getProfitTrend(
        mockCompanyId,
        mockRequest,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
      );

      expect(mockProfitService.getProfitTrend).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
      );
    });
  });
});
