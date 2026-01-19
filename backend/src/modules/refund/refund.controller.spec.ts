import { Test, TestingModule } from '@nestjs/testing';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('RefundController', () => {
  let controller: RefundController;
  let refundService: RefundService;

  const mockCompanyId = 'company-123';
  const mockUserId = 'user-123';
  const mockRequest = { user: { sub: mockUserId } };

  const mockRefundSummary = {
    totalRefunds: 10,
    totalRefundAmount: 1500,
    refundRate: 5,
    totalOrders: 200,
    avgRefundAmount: 150,
    previousRefunds: 8,
    previousRefundAmount: 1200,
    refundCountChange: 25,
    refundAmountChange: 25,
  };

  const mockRefundList = {
    refunds: [
      {
        id: 'refund-1',
        orderId: 'order-1',
        orderNumber: '#1001',
        amount: 150,
        reason: 'Ürün hasarlı',
        refundDate: new Date(),
        storeName: 'Test Store',
        customerName: 'Test Customer',
        orderTotal: 300,
      },
    ],
    total: 1,
    page: 1,
    totalPages: 1,
  };

  const mockRefundReasons = [
    {
      reason: 'Ürün hasarlı',
      count: 5,
      totalAmount: 750,
      percentage: 50,
    },
    {
      reason: 'Yanlış ürün',
      count: 5,
      totalAmount: 750,
      percentage: 50,
    },
  ];

  const mockRefundTrend = [
    {
      date: '2025-01-15',
      count: 2,
      amount: 300,
    },
  ];

  const mockStoreComparison = [
    {
      storeId: 'store-1',
      storeName: 'Store A',
      refundCount: 5,
      refundAmount: 750,
      totalOrders: 100,
      refundRate: 5,
    },
  ];

  const mockRefundService = {
    getRefundSummary: jest.fn(),
    getRefundList: jest.fn(),
    getRefundReasons: jest.fn(),
    getRefundTrend: jest.fn(),
    getStoreComparison: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RefundController],
      providers: [
        {
          provide: RefundService,
          useValue: mockRefundService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<RefundController>(RefundController);
    refundService = module.get<RefundService>(RefundService);

    jest.clearAllMocks();
  });

  describe('getRefundSummary', () => {
    it('should return refund summary', async () => {
      mockRefundService.getRefundSummary.mockResolvedValue(mockRefundSummary);

      const result = await controller.getRefundSummary(
        mockCompanyId,
        mockRequest,
      );

      expect(result).toEqual(mockRefundSummary);
      expect(mockRefundService.getRefundSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass period filter', async () => {
      mockRefundService.getRefundSummary.mockResolvedValue(mockRefundSummary);

      await controller.getRefundSummary(mockCompanyId, mockRequest, '7d');

      expect(mockRefundService.getRefundSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass store filter', async () => {
      mockRefundService.getRefundSummary.mockResolvedValue(mockRefundSummary);
      const storeId = 'store-123';

      await controller.getRefundSummary(mockCompanyId, mockRequest, '30d', storeId);

      expect(mockRefundService.getRefundSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '30d',
        storeId,
        undefined,
        undefined,
      );
    });

    it('should pass custom date range', async () => {
      mockRefundService.getRefundSummary.mockResolvedValue(mockRefundSummary);

      await controller.getRefundSummary(
        mockCompanyId,
        mockRequest,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
      );

      expect(mockRefundService.getRefundSummary).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        'custom',
        undefined,
        '2025-01-01',
        '2025-01-15',
      );
    });
  });

  describe('getRefundList', () => {
    it('should return paginated refund list', async () => {
      mockRefundService.getRefundList.mockResolvedValue(mockRefundList);

      const result = await controller.getRefundList(mockCompanyId, mockRequest);

      expect(result).toEqual(mockRefundList);
      expect(mockRefundService.getRefundList).toHaveBeenCalledWith(
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
      mockRefundService.getRefundList.mockResolvedValue(mockRefundList);

      await controller.getRefundList(
        mockCompanyId,
        mockRequest,
        '30d',
        undefined,
        undefined,
        undefined,
        '2',
        '20',
      );

      expect(mockRefundService.getRefundList).toHaveBeenCalledWith(
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
  });

  describe('getRefundReasons', () => {
    it('should return refund reasons', async () => {
      mockRefundService.getRefundReasons.mockResolvedValue(mockRefundReasons);

      const result = await controller.getRefundReasons(mockCompanyId, mockRequest);

      expect(result).toEqual(mockRefundReasons);
      expect(mockRefundService.getRefundReasons).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass filters', async () => {
      mockRefundService.getRefundReasons.mockResolvedValue(mockRefundReasons);

      await controller.getRefundReasons(
        mockCompanyId,
        mockRequest,
        '7d',
        'store-123',
      );

      expect(mockRefundService.getRefundReasons).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        'store-123',
        undefined,
        undefined,
      );
    });
  });

  describe('getRefundTrend', () => {
    it('should return refund trend', async () => {
      mockRefundService.getRefundTrend.mockResolvedValue(mockRefundTrend);

      const result = await controller.getRefundTrend(mockCompanyId, mockRequest);

      expect(result).toEqual(mockRefundTrend);
      expect(mockRefundService.getRefundTrend).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass period filter', async () => {
      mockRefundService.getRefundTrend.mockResolvedValue(mockRefundTrend);

      await controller.getRefundTrend(mockCompanyId, mockRequest, '7d');

      expect(mockRefundService.getRefundTrend).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        undefined,
        undefined,
        undefined,
      );
    });
  });

  describe('getStoreComparison', () => {
    it('should return store comparison', async () => {
      mockRefundService.getStoreComparison.mockResolvedValue(mockStoreComparison);

      const result = await controller.getStoreComparison(mockCompanyId, mockRequest);

      expect(result).toEqual(mockStoreComparison);
      expect(mockRefundService.getStoreComparison).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass period filter', async () => {
      mockRefundService.getStoreComparison.mockResolvedValue(mockStoreComparison);

      await controller.getStoreComparison(mockCompanyId, mockRequest, '7d');

      expect(mockRefundService.getStoreComparison).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        '7d',
        undefined,
        undefined,
      );
    });

    it('should pass custom date range', async () => {
      mockRefundService.getStoreComparison.mockResolvedValue(mockStoreComparison);

      await controller.getStoreComparison(
        mockCompanyId,
        mockRequest,
        'custom',
        '2025-01-01',
        '2025-01-15',
      );

      expect(mockRefundService.getStoreComparison).toHaveBeenCalledWith(
        mockCompanyId,
        mockUserId,
        'custom',
        '2025-01-01',
        '2025-01-15',
      );
    });
  });
});
