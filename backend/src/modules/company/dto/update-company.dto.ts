import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Şirket adı', example: 'Acme Inc.', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Şirket adı en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'Şirket adı en fazla 100 karakter olabilir' })
  name?: string;

  @ApiProperty({ description: 'Şirket logosu (base64 data URL)', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/, {
    message: 'Logo geçerli bir base64 görsel formatında olmalıdır',
  })
  logo?: string;
}
