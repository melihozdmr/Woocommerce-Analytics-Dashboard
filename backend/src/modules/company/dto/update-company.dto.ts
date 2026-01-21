import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyDto {
  @ApiProperty({ description: 'Şirket adı', example: 'Acme Inc.', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'Şirket adı en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'Şirket adı en fazla 100 karakter olabilir' })
  name?: string;
}
