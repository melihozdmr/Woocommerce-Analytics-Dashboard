import { Controller, Get, Patch, Post, Param, Query, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';

interface BulkUpdateItem {
  productId: string;
  variationId?: string;
  stockQuantity?: number;
  purchasePrice?: number;
}

@ApiTags('inventory')
@Controller('company/:companyId/inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  async getSummary(
    @Param('companyId') companyId: string,
    @Query('criticalThreshold') criticalThreshold?: string,
  ) {
    const threshold = criticalThreshold ? parseInt(criticalThreshold, 10) : 5;
    return this.inventoryService.getSummary(companyId, threshold);
  }

  @Get('by-store')
  async getByStore(
    @Param('companyId') companyId: string,
    @Query('criticalThreshold') criticalThreshold?: string,
  ) {
    const threshold = criticalThreshold ? parseInt(criticalThreshold, 10) : 5;
    return this.inventoryService.getByStore(companyId, threshold);
  }

  @Get('critical')
  async getCriticalProducts(
    @Param('companyId') companyId: string,
    @Query('criticalThreshold') criticalThreshold?: string,
    @Query('storeId') storeId?: string,
  ) {
    const threshold = criticalThreshold ? parseInt(criticalThreshold, 10) : 5;
    return this.inventoryService.getCriticalProducts(companyId, threshold, storeId);
  }

  @Get('products')
  async getProducts(
    @Param('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('storeId') storeId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('stockStatus') stockStatus?: 'instock' | 'outofstock' | 'critical',
    @Query('mappingStatus') mappingStatus?: 'mapped' | 'unmapped',
    @Query('criticalThreshold') criticalThreshold?: string,
  ) {
    return this.inventoryService.getProducts(companyId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      storeId,
      search,
      sortBy,
      sortOrder,
      stockStatus,
      mappingStatus,
      criticalThreshold: criticalThreshold ? parseInt(criticalThreshold, 10) : 5,
    });
  }

  @Get('products/:productId')
  async getProduct(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
  ) {
    const product = await this.inventoryService.getProduct(companyId, productId);
    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }
    return product;
  }

  @Patch('products/:productId/stock')
  async updateProductStock(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body('stockQuantity') stockQuantity: number,
  ) {
    return this.inventoryService.updateProductStock(companyId, productId, stockQuantity);
  }

  @Patch('variations/:variationId/stock')
  async updateVariationStock(
    @Param('companyId') companyId: string,
    @Param('variationId') variationId: string,
    @Body('stockQuantity') stockQuantity: number,
  ) {
    return this.inventoryService.updateVariationStock(companyId, variationId, stockQuantity);
  }

  @Patch('products/:productId/purchase-price')
  async updateProductPurchasePrice(
    @Param('companyId') companyId: string,
    @Param('productId') productId: string,
    @Body('purchasePrice') purchasePrice: number,
  ) {
    return this.inventoryService.updateProductPurchasePrice(companyId, productId, purchasePrice);
  }

  @Patch('variations/:variationId/purchase-price')
  async updateVariationPurchasePrice(
    @Param('companyId') companyId: string,
    @Param('variationId') variationId: string,
    @Body('purchasePrice') purchasePrice: number,
  ) {
    return this.inventoryService.updateVariationPurchasePrice(companyId, variationId, purchasePrice);
  }

  @Post('bulk-update')
  async bulkUpdate(
    @Param('companyId') companyId: string,
    @Body('items') items: BulkUpdateItem[],
    @Body('syncToStore') syncToStore?: boolean,
  ) {
    return this.inventoryService.bulkUpdate(companyId, items, syncToStore);
  }

  @Post('sync-purchase-prices')
  async syncPurchasePricesFromStore(
    @Param('companyId') companyId: string,
    @Body('storeId') storeId: string,
  ) {
    return this.inventoryService.syncPurchasePricesFromStore(companyId, storeId);
  }
}
