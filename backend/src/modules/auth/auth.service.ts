import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async checkEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, isEmailVerified: true },
    });

    if (!user) {
      return { exists: false, status: 'not_found' };
    }

    if (!user.isEmailVerified) {
      return { exists: true, status: 'needs_verification' };
    }

    return { exists: true, status: 'verified' };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // Resend verification code
        const verificationCode = this.generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            emailVerificationCode: verificationCode,
            emailVerificationExpiry: verificationExpiry,
          },
        });

        await this.emailService.sendVerificationCode(
          existingUser.email,
          verificationCode,
          existingUser.name || undefined,
        );

        return {
          message: 'Doğrulama kodu e-posta adresinize gönderildi',
          email: existingUser.email,
          requiresVerification: true,
        };
      }
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const freePlan = await this.prisma.plan.findFirst({
      where: { name: 'FREE' },
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        planId: freePlan?.id,
        isEmailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      },
      include: { plan: true },
    });

    // Send verification email
    await this.emailService.sendVerificationCode(
      user.email,
      verificationCode,
      user.name || undefined,
    );

    return {
      message: 'Kayıt başarılı. Doğrulama kodu e-posta adresinize gönderildi',
      email: user.email,
      requiresVerification: true,
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { plan: true, currentCompany: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('E-posta zaten doğrulanmış');
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
      throw new BadRequestException('Doğrulama kodu bulunamadı');
    }

    if (user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Doğrulama kodunun süresi dolmuş');
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException('Geçersiz doğrulama kodu');
    }

    // Verify email and clear verification data
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpiry: null,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        currentCompanyId: user.currentCompanyId,
      },
      ...tokens,
    };
  }

  async resendVerificationCode(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('E-posta zaten doğrulanmış');
    }

    const verificationCode = this.generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    await this.emailService.sendVerificationCode(
      user.email,
      verificationCode,
      user.name || undefined,
    );

    return {
      message: 'Yeni doğrulama kodu gönderildi',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { plan: true, currentCompany: true },
    });

    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Hesabınız aktif değil');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      // Generate new verification code and send
      const verificationCode = this.generateVerificationCode();
      const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: verificationCode,
          emailVerificationExpiry: verificationExpiry,
        },
      });

      await this.emailService.sendVerificationCode(
        user.email,
        verificationCode,
        user.name || undefined,
      );

      return {
        message: 'E-posta adresiniz doğrulanmamış. Doğrulama kodu gönderildi.',
        email: user.email,
        requiresVerification: true,
      };
    }

    const tokens = await this.generateTokens(
      user.id,
      user.email,
      dto.rememberMe,
    );
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        currentCompanyId: user.currentCompanyId,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });

    return { message: 'Çıkış başarılı' };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: { include: { plan: true, currentCompany: true } } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Geçersiz refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token süresi dolmuş');
    }

    const user = storedToken.user;

    if (!user.isActive) {
      throw new UnauthorizedException('Hesabınız aktif değil');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.plan,
        currentCompanyId: user.currentCompanyId,
      },
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
    }

    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.name || undefined,
    );

    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Şifreniz başarıyla güncellendi' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { plan: true, currentCompany: true },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      currentCompanyId: user.currentCompanyId,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    rememberMe = false,
  ) {
    const payload = { sub: userId, email };

    const accessTokenExpiry = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        expiresIn: accessTokenExpiry as any,
      }),
      this.jwtService.signAsync(payload as any, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: refreshTokenExpiry as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpiry,
    };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }
}
