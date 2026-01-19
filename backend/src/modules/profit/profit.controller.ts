import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfitService } from './profit.service';

@Controller('companies/:companyId/profit')
@UseGuards(JwtAuthGuard)
export class ProfitController {
  constructor(private profitService: ProfitService) {}

  /**
   * Get profit summary (KPIs)
   * GET /companies/:companyId/profit/summary
   */
  @Get('summary')
  async getProfitSummary(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.profitService.getProfitSummary(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get product-based profit analysis
   * GET /companies/:companyId/profit/products
   */
  @Get('products')
  async getProductProfits(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profitService.getProductProfits(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * Get order-based profit analysis
   * GET /companies/:companyId/profit/orders
   */
  @Get('orders')
  async getOrderProfits(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.profitService.getOrderProfits(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /**
   * Get profit trend
   * GET /companies/:companyId/profit/trend
   */
  @Get('trend')
  async getProfitTrend(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.profitService.getProfitTrend(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }
}
