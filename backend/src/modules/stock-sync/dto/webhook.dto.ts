import { IsString, IsOptional, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class WebhookDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  product_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  variation_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  stock_quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  purchase_price?: number;
}

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Event type', example: 'stock.updated' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Store URL', example: 'https://mystore.com' })
  @IsString()
  store_url: string;

  @ApiProperty({ description: 'Timestamp', example: '2024-01-19T12:00:00Z' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'HMAC-SHA256 signature' })
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Event data' })
  @IsObject()
  @ValidateNested()
  @Type(() => WebhookDataDto)
  data: WebhookDataDto;
}

export class UpdateStockDto {
  @ApiProperty({ description: 'New stock quantity' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Sync to remote WooCommerce', default: true })
  @IsOptional()
  syncToRemote?: boolean;
}

export class UpdatePurchasePriceDto {
  @ApiProperty({ description: 'New purchase price' })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Sync to remote WooCommerce', default: true })
  @IsOptional()
  syncToRemote?: boolean;
}
