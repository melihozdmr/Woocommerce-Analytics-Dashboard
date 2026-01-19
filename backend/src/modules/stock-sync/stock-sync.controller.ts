import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StockSyncService, WebhookPayload } from './stock-sync.service';
import { WebhookPayloadDto, UpdateStockDto, UpdatePurchasePriceDto } from './dto/webhook.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Stock Sync')
@Controller()
export class StockSyncController {
  constructor(private readonly stockSyncService: StockSyncService) {}

  // === Public Webhook Endpoint ===

  @Post('webhook/stock-sync')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive stock update webhooks from WooCommerce' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  @ApiResponse({ status: 400, description: 'Invalid webhook payload' })
  async receiveWebhook(
    @Body() payload: WebhookPayloadDto,
    @Headers('x-wcsc-signature') signature: string,
  ) {
    // Timestamp kontrolü (5 dakika tolerance)
    const webhookTime = new Date(payload.timestamp).getTime();
    const now = Date.now();
    const tolerance = 5 * 60 * 1000; // 5 dakika

    if (Math.abs(now - webhookTime) > tolerance) {
      throw new BadRequestException({
        success: false,
        error: 'Webhook timestamp is too old or in the future',
      });
    }

    // Webhook işle
    const result = await this.stockSyncService.handleStockWebhook(
      payload as unknown as WebhookPayload,
    );

    return {
      success: result.processed,
      synced: result.synced,
      message: result.processed
        ? `Webhook processed, synced to ${result.synced} stores`
        : 'Webhook could not be processed',
    };
  }

  // === Dashboard Stock Management Endpoints ===

  @Post('inventory/:productId/stock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product stock from dashboard' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  async updateStock(
    @Param('productId') productId: string,
    @Body() dto: UpdateStockDto,
  ) {
    const result = await this.stockSyncService.updateStockFromDashboard(
      productId,
      dto.quantity,
      dto.syncToRemote !== false,
    );

    return {
      success: result.success,
      productId: result.productId,
      newStock: result.newStock,
      error: result.error,
    };
  }

  @Post('inventory/:productId/purchase-price')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product purchase price from dashboard' })
  @ApiResponse({ status: 200, description: 'Purchase price updated' })
  async updatePurchasePrice(
    @Param('productId') productId: string,
    @Body() dto: UpdatePurchasePriceDto,
  ) {
    const result = await this.stockSyncService.updatePurchasePriceFromDashboard(
      productId,
      dto.price,
      dto.syncToRemote !== false,
    );

    return {
      success: result.success,
      productId: result.productId,
      error: result.error,
    };
  }

  // === Webhook Logs ===

  @Get('stores/:storeId/webhook-logs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook logs for a store' })
  async getWebhookLogs(
    @Param('storeId') storeId: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.stockSyncService.getWebhookLogs(
      storeId,
      parseInt(limit || '50'),
    );

    return { logs };
  }

  @Get('stores/:storeId/webhook-stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook statistics for a store' })
  async getWebhookStats(
    @Param('storeId') storeId: string,
    @Query('days') days?: string,
  ) {
    return this.stockSyncService.getWebhookStats(
      storeId,
      parseInt(days || '7'),
    );
  }
}
