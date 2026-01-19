import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderService } from './order.service';

@Controller('companies/:companyId/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  /**
   * Get orders list with pagination
   * GET /companies/:companyId/orders
   */
  @Get()
  async getOrders(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('storeId') storeId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getOrders(companyId, req.user.sub, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
      storeId,
      search,
      sortBy,
      sortOrder,
      startDate,
      endDate,
    });
  }

  /**
   * Get order summary (KPIs)
   * GET /companies/:companyId/orders/summary
   */
  @Get('summary')
  async getOrderSummary(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getOrderSummary(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get order trend (daily data for charts)
   * GET /companies/:companyId/orders/trend
   */
  @Get('trend')
  async getOrderTrend(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getOrderTrend(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get status distribution
   * GET /companies/:companyId/orders/status-distribution
   */
  @Get('status-distribution')
  async getStatusDistribution(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getStatusDistribution(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get payment method distribution
   * GET /companies/:companyId/orders/payment-distribution
   */
  @Get('payment-distribution')
  async getPaymentMethodDistribution(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getPaymentMethodDistribution(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get store distribution (orders by store)
   * GET /companies/:companyId/orders/store-distribution
   */
  @Get('store-distribution')
  async getStoreDistribution(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.orderService.getStoreDistribution(
      companyId,
      req.user.sub,
      period,
      startDate,
      endDate,
    );
  }

  /**
   * Get recent orders
   * GET /companies/:companyId/orders/recent
   */
  @Get('recent')
  async getRecentOrders(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.orderService.getRecentOrders(
      companyId,
      req.user.sub,
      limit ? parseInt(limit, 10) : undefined,
      storeId,
    );
  }
}
