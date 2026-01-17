import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findFirst: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_EXPIRES_IN: '15m',
      };
      return config[key];
    }),
  };

  const mockEmailService = {
    sendVerificationCode: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@test.com',
      name: 'Test User',
      password: 'Test1234',
    };

    it('should register a new user and require email verification', async () => {
      const mockPlan = { id: 'plan-id', name: 'FREE' };
      const mockUser = {
        id: 'user-id',
        email: registerDto.email,
        name: registerDto.name,
        role: 'USER',
        isEmailVerified: false,
        plan: mockPlan,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.plan.findFirst.mockResolvedValue(mockPlan);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe(registerDto.email);
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should resend verification code if user exists but email not verified', async () => {
      const existingUser = {
        id: 'existing-user',
        email: registerDto.email,
        isEmailVerified: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(existingUser);

      const result = await service.register(registerDto);

      expect(result.requiresVerification).toBe(true);
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: registerDto.email,
        isEmailVerified: true,
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@test.com',
      password: 'Test1234',
    };

    const mockUser = {
      id: 'user-id',
      email: loginDto.email,
      name: 'Test User',
      password: 'hashed-password',
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
      plan: { id: 'plan-id', name: 'FREE' },
    };

    it('should login successfully with verified email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result.user?.email).toBe(loginDto.email);
      expect(result.accessToken).toBe('access-token');
    });

    it('should require verification if email not verified', async () => {
      const unverifiedUser = { ...mockUser, isEmailVerified: false };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(unverifiedUser);

      const result = await service.login(loginDto);

      expect(result.requiresVerification).toBe(true);
      expect(result.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token on logout', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.logout('user-id', 'refresh-token');

      expect(result.message).toBe('Çıkış başarılı');
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-id', token: 'refresh-token' },
      });
    });
  });

  describe('getMe', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: 'USER',
        plan: { id: 'plan-id', name: 'FREE' },
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-id');

      expect(result.email).toBe(mockUser.email);
      expect(result.name).toBe(mockUser.name);
    });
  });
});
