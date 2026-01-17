import { IsString, IsOptional, MinLength, IsNumber, Min, Max, Matches, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StoreStatus } from '@prisma/client';

export class UpdateStoreDto {
  @ApiProperty({ description: 'Mağaza durumu', required: false, enum: StoreStatus })
  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;
  @ApiProperty({ description: 'Mağaza adı', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'WooCommerce site URL', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^(https?:\/\/)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:\d+)?(\/.*)?$/, {
    message: 'Geçerli bir URL giriniz',
  })
  url?: string;

  @ApiProperty({ description: 'WooCommerce Consumer Key', required: false })
  @IsString()
  @MinLength(32, { message: 'Consumer Key en az 32 karakter olmalı' })
  @IsOptional()
  consumerKey?: string;

  @ApiProperty({ description: 'WooCommerce Consumer Secret', required: false })
  @IsString()
  @MinLength(32, { message: 'Consumer Secret en az 32 karakter olmalı' })
  @IsOptional()
  consumerSecret?: string;

  @ApiProperty({ description: 'Komisyon oranı (%)', required: false, example: 15 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  commissionRate?: number;

  @ApiProperty({ description: 'Kargo ücreti (TL)', required: false, example: 25 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCost?: number;
}
