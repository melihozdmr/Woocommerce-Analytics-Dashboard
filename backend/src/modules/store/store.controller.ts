import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateStoreDto, UpdateStoreDto } from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('stores')
@Controller('company/:companyId/stores')
@ApiBearerAuth()
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bağlantıyı test et (mağaza oluşturmadan)' })
  @ApiResponse({ status: 200, description: 'Test sonucu' })
  async testConnectionWithoutStore(
    @Param('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: { url: string; consumerKey: string; consumerSecret: string },
  ) {
    return this.storeService.testConnectionWithCredentials(companyId, userId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni mağaza ekle' })
  @ApiResponse({ status: 201, description: 'Mağaza oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Bağlantı hatası veya limit aşımı' })
  async createStore(
    @Param('companyId') companyId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storeService.createStore(companyId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Mağazaları listele' })
  @ApiResponse({ status: 200, description: 'Mağaza listesi' })
  async getStores(
    @Param('companyId') companyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storeService.getStores(companyId, userId);
  }

  @Get(':storeId')
  @ApiOperation({ summary: 'Mağaza detayı' })
  @ApiResponse({ status: 200, description: 'Mağaza bilgisi' })
  @ApiResponse({ status: 404, description: 'Mağaza bulunamadı' })
  async getStore(
    @Param('companyId') companyId: string,
    @Param('storeId') storeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storeService.getStore(companyId, storeId, userId);
  }

  @Put(':storeId')
  @ApiOperation({ summary: 'Mağaza güncelle' })
  @ApiResponse({ status: 200, description: 'Mağaza güncellendi' })
  @ApiResponse({ status: 404, description: 'Mağaza bulunamadı' })
  async updateStore(
    @Param('companyId') companyId: string,
    @Param('storeId') storeId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storeService.updateStore(companyId, storeId, userId, dto);
  }

  @Delete(':storeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mağaza sil' })
  @ApiResponse({ status: 200, description: 'Mağaza silindi' })
  @ApiResponse({ status: 404, description: 'Mağaza bulunamadı' })
  async deleteStore(
    @Param('companyId') companyId: string,
    @Param('storeId') storeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storeService.deleteStore(companyId, storeId, userId);
  }

  @Post(':storeId/test-connection')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bağlantıyı test et' })
  @ApiResponse({ status: 200, description: 'Test sonucu' })
  @ApiResponse({ status: 404, description: 'Mağaza bulunamadı' })
  async testConnection(
    @Param('companyId') companyId: string,
    @Param('storeId') storeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storeService.testConnection(companyId, storeId, userId);
  }

  @Post(':storeId/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manuel senkronizasyon başlat' })
  @ApiResponse({ status: 200, description: 'Senkronizasyon tamamlandı' })
  @ApiResponse({ status: 404, description: 'Mağaza bulunamadı' })
  async syncStore(
    @Param('companyId') companyId: string,
    @Param('storeId') storeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storeService.syncStore(companyId, storeId, userId);
  }
}
