import { IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ description: 'Kullanıcı adı', example: 'Ahmet Yılmaz', required: false })
  @IsString()
  @IsOptional()
  @MinLength(2, { message: 'İsim en az 2 karakter olmalıdır' })
  @MaxLength(100, { message: 'İsim en fazla 100 karakter olabilir' })
  name?: string;

  @ApiProperty({ description: 'Mevcut şifre (şifre değişikliği için gerekli)', required: false })
  @IsString()
  @IsOptional()
  currentPassword?: string;

  @ApiProperty({ description: 'Yeni şifre', required: false })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
  newPassword?: string;
}
