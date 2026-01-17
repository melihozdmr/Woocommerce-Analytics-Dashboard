import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ description: 'Şirket adı', example: 'Acme Inc.' })
  @IsString()
  @IsNotEmpty({ message: 'Şirket adı boş olamaz' })
  @MinLength(2, { message: 'Şirket adı en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'Şirket adı en fazla 100 karakter olabilir' })
  name: string;
}
