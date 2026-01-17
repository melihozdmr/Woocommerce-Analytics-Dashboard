import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ description: 'Mağaza adı', example: 'Ana Mağazam' })
  @IsString()
  @IsNotEmpty({ message: 'Mağaza adı gerekli' })
  name: string;

  @ApiProperty({ description: 'WooCommerce site URL', example: 'https://example.com' })
  @IsString()
  @IsNotEmpty({ message: 'Site URL gerekli' })
  @Matches(/^(https?:\/\/)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:\d+)?(\/.*)?$/, {
    message: 'Geçerli bir URL giriniz',
  })
  url: string;

  @ApiProperty({ description: 'WooCommerce Consumer Key', example: 'ck_xxxxxxxx' })
  @IsString()
  @MinLength(32, { message: 'Consumer Key en az 32 karakter olmalı' })
  consumerKey: string;

  @ApiProperty({ description: 'WooCommerce Consumer Secret', example: 'cs_xxxxxxxx' })
  @IsString()
  @MinLength(32, { message: 'Consumer Secret en az 32 karakter olmalı' })
  consumerSecret: string;
}
