import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'Password123!', description: 'User password' })
  @IsString({ message: 'Şifre zorunludur' })
  password: string;

  @ApiProperty({ example: false, description: 'Remember me option', required: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
