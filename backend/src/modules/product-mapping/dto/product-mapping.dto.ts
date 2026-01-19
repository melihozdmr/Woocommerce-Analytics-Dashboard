import { IsString, IsArray, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMappingDto {
  @ApiProperty({ description: 'Ana SKU kodu' })
  @IsString()
  masterSku: string;

  @ApiPropertyOptional({ description: 'Eşleştirme grubu adı' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Eşleştirilecek ürün IDleri', type: [String] })
  @IsArray()
  @ArrayMinSize(2, { message: 'En az 2 ürün eşleştirilmelidir' })
  @IsString({ each: true })
  productIds: string[];
}

export class UpdateMappingDto {
  @ApiPropertyOptional({ description: 'Ana SKU kodu' })
  @IsOptional()
  @IsString()
  masterSku?: string;

  @ApiPropertyOptional({ description: 'Eşleştirme grubu adı' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class AddProductsToMappingDto {
  @ApiProperty({ description: 'Eklenecek ürün IDleri', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  productIds: string[];
}

export class RemoveProductsFromMappingDto {
  @ApiProperty({ description: 'Çıkarılacak ürün IDleri', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  productIds: string[];
}

export class AutoMatchDto {
  @ApiPropertyOptional({ description: 'Sadece belirli mağazalar için eşleştir' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeIds?: string[];
}
