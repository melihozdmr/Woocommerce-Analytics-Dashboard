import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  ValidateNested,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ApiKeyPermissionsDto {
  @ApiProperty({ description: 'Read permission', default: true })
  @IsBoolean()
  read: boolean;

  @ApiProperty({ description: 'Write permission', default: false })
  @IsBoolean()
  write: boolean;
}

export class CreateApiKeyDto {
  @ApiProperty({ description: 'API key name', example: 'Production Key' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Permissions for this API key',
    type: ApiKeyPermissionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ApiKeyPermissionsDto)
  permissions?: ApiKeyPermissionsDto;

  @ApiPropertyOptional({
    description: 'Expiration date (ISO string)',
    example: '2027-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
