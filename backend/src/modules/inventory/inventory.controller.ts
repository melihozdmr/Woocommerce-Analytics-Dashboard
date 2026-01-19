import { Controller, Get, Patch, Param, Query, Body, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';

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
}
