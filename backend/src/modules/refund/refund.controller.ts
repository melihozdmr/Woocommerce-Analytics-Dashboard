import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RefundService } from './refund.service';

@Controller('companies/:companyId/refunds')
@UseGuards(JwtAuthGuard)
export class RefundController {
  constructor(private refundService: RefundService) {}

  /**
   * Get refund summary (KPIs)
   * GET /companies/:companyId/refunds/summary
   */
  @Get('summary')
  async getRefundSummary(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.refundService.getRefundSummary(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get refund list with pagination
   * GET /companies/:companyId/refunds/list
   */
  @Get('list')
  async getRefundList(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.refundService.getRefundList(
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
   * Get refund reasons distribution
   * GET /companies/:companyId/refunds/reasons
   */
  @Get('reasons')
  async getRefundReasons(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.refundService.getRefundReasons(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get refund trend
   * GET /companies/:companyId/refunds/trend
   */
  @Get('trend')
  async getRefundTrend(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('storeId') storeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.refundService.getRefundTrend(
      companyId,
      req.user.sub,
      period,
      storeId,
      startDate,
      endDate,
    );
  }

  /**
   * Get store comparison for refunds
   * GET /companies/:companyId/refunds/stores
   */
  @Get('stores')
  async getStoreComparison(
    @Param('companyId') companyId: string,
    @Request() req: any,
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.refundService.getStoreComparison(
      companyId,
      req.user.sub,
      period,
      startDate,
      endDate,
    );
  }
}
