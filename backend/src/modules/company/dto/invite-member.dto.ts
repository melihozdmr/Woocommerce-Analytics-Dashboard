import { IsString, IsNotEmpty, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum InviteRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  STOCKIST = 'STOCKIST',
}

export class InviteMemberDto {
  @ApiProperty({ description: 'Davet edilecek e-posta', example: 'user@example.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  @IsNotEmpty({ message: 'E-posta adresi boş olamaz' })
  email: string;

  @ApiProperty({ description: 'Üye rolü', enum: InviteRole, example: 'MEMBER' })
  @IsEnum(InviteRole, { message: 'Geçersiz rol' })
  role: InviteRole;
}
