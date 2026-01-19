import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductMappingService, MappingWithDetails, MappingSuggestion } from './product-mapping.service';
import {
  CreateMappingDto,
  UpdateMappingDto,
  AddProductsToMappingDto,
  RemoveProductsFromMappingDto,
  AutoMatchDto,
} from './dto/product-mapping.dto';

@ApiTags('Product Mappings')
@ApiBearerAuth()
@Controller('company/:companyId/products/mappings')
export class ProductMappingController {
  constructor(private readonly mappingService: ProductMappingService) {}

  @Get()
  @ApiOperation({ summary: 'Tüm ürün eşleştirmelerini listele' })
  @ApiResponse({ status: 200, description: 'Eşleştirme listesi' })
  async getMappings(
    @Param('companyId') companyId: string,
  ): Promise<MappingWithDetails[]> {
    return this.mappingService.getMappings(companyId);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'SKU bazlı eşleştirme önerilerini al' })
  @ApiQuery({ name: 'storeIds', required: false, type: [String] })
  @ApiResponse({ status: 200, description: 'Eşleştirme önerileri' })
  async getSuggestions(
    @Param('companyId') companyId: string,
    @Query('storeIds') storeIds?: string | string[],
  ): Promise<MappingSuggestion[]> {
    const storeIdArray = storeIds
      ? Array.isArray(storeIds)
        ? storeIds
        : [storeIds]
      : undefined;
    return this.mappingService.getSuggestions(companyId, storeIdArray);
  }

  @Get('search')
  @ApiOperation({ summary: 'Eşleştirme için ürün ara' })
  @ApiQuery({ name: 'q', required: true, description: 'Arama terimi (ürün adı veya SKU)' })
  @ApiQuery({ name: 'storeId', required: false, description: 'Mağaza ID filtresi' })
  @ApiResponse({ status: 200, description: 'Arama sonuçları' })
  async searchProducts(
    @Param('companyId') companyId: string,
    @Query('q') query: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.mappingService.searchProductsForMapping(companyId, query, storeId);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Konsolide envanter görünümü' })
  @ApiResponse({ status: 200, description: 'Konsolide envanter' })
  async getConsolidatedInventory(
    @Param('companyId') companyId: string,
  ): Promise<
    {
      masterSku: string;
      name: string | null;
      mappingId: string;
      totalStock: number;
      stores: { storeId: string; storeName: string; stock: number }[];
    }[]
  > {
    return this.mappingService.getConsolidatedInventory(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek bir eşleştirmeyi getir' })
  @ApiResponse({ status: 200, description: 'Eşleştirme detayları' })
  @ApiResponse({ status: 404, description: 'Eşleştirme bulunamadı' })
  async getMapping(
    @Param('companyId') companyId: string,
    @Param('id') mappingId: string,
  ): Promise<MappingWithDetails> {
    return this.mappingService.getMapping(companyId, mappingId);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni ürün eşleştirmesi oluştur' })
  @ApiResponse({ status: 201, description: 'Eşleştirme oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  async createMapping(
    @Param('companyId') companyId: string,
    @Body() dto: CreateMappingDto,
  ): Promise<MappingWithDetails> {
    return this.mappingService.createMapping(companyId, dto);
  }

  @Post('auto')
  @ApiOperation({ summary: 'Otomatik eşleştirme çalıştır' })
  @ApiResponse({ status: 200, description: 'Otomatik eşleştirme sonuçları' })
  async autoMatch(
    @Param('companyId') companyId: string,
    @Body() dto: AutoMatchDto,
  ): Promise<{ created: number; skipped: number }> {
    return this.mappingService.autoMatch(companyId, dto.storeIds);
  }

  @Post('suggestions/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Öneriyi reddet' })
  @ApiResponse({ status: 204, description: 'Öneri reddedildi' })
  async dismissSuggestion(
    @Param('companyId') companyId: string,
    @Body() dto: { suggestionKey: string },
  ): Promise<void> {
    return this.mappingService.dismissSuggestion(companyId, dto.suggestionKey);
  }

  @Delete('suggestions/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reddedilen öneriyi geri al' })
  @ApiResponse({ status: 204, description: 'Öneri geri alındı' })
  async restoreSuggestion(
    @Param('companyId') companyId: string,
    @Body() dto: { suggestionKey: string },
  ): Promise<void> {
    return this.mappingService.restoreSuggestion(companyId, dto.suggestionKey);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Eşleştirmeyi güncelle' })
  @ApiResponse({ status: 200, description: 'Eşleştirme güncellendi' })
  @ApiResponse({ status: 404, description: 'Eşleştirme bulunamadı' })
  async updateMapping(
    @Param('companyId') companyId: string,
    @Param('id') mappingId: string,
    @Body() dto: UpdateMappingDto,
  ): Promise<MappingWithDetails> {
    return this.mappingService.updateMapping(companyId, mappingId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eşleştirmeyi sil' })
  @ApiResponse({ status: 204, description: 'Eşleştirme silindi' })
  @ApiResponse({ status: 404, description: 'Eşleştirme bulunamadı' })
  async deleteMapping(
    @Param('companyId') companyId: string,
    @Param('id') mappingId: string,
  ): Promise<void> {
    return this.mappingService.deleteMapping(companyId, mappingId);
  }

  @Post(':id/products')
  @ApiOperation({ summary: 'Eşleştirmeye ürün ekle' })
  @ApiResponse({ status: 200, description: 'Ürünler eklendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  @ApiResponse({ status: 404, description: 'Eşleştirme bulunamadı' })
  async addProductsToMapping(
    @Param('companyId') companyId: string,
    @Param('id') mappingId: string,
    @Body() dto: AddProductsToMappingDto,
  ): Promise<MappingWithDetails> {
    return this.mappingService.addProductsToMapping(companyId, mappingId, dto);
  }

  @Delete(':id/products')
  @ApiOperation({ summary: 'Eşleştirmeden ürün çıkar' })
  @ApiResponse({ status: 200, description: 'Ürünler çıkarıldı' })
  @ApiResponse({ status: 400, description: 'Geçersiz istek' })
  @ApiResponse({ status: 404, description: 'Eşleştirme bulunamadı' })
  async removeProductsFromMapping(
    @Param('companyId') companyId: string,
    @Param('id') mappingId: string,
    @Body() dto: RemoveProductsFromMappingDto,
  ): Promise<MappingWithDetails> {
    return this.mappingService.removeProductsFromMapping(companyId, mappingId, dto);
  }
}
