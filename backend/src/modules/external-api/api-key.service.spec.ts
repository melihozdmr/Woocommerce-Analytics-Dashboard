import { Test, TestingModule } from '@nestjs/testing';
import { ApiKeyService } from './api-key.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ApiKeyService', () => {
  let service: ApiKeyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    apiKey: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    apiUsageLog: {
      create: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateApiKey', () => {
    it('should generate a valid API key', () => {
      const result = service.generateApiKey();

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('prefix');
      expect(result).toHaveProperty('hash');
      expect(result.key).toMatch(/^wca_[a-f0-9]{64}$/);
      expect(result.prefix).toHaveLength(8);
      expect(result.hash).toHaveLength(64);
    });

    it('should generate unique keys', () => {
      const key1 = service.generateApiKey();
      const key2 = service.generateApiKey();

      expect(key1.key).not.toEqual(key2.key);
      expect(key1.hash).not.toEqual(key2.hash);
    });
  });

  describe('hashApiKey', () => {
    it('should hash an API key consistently', () => {
      const key = 'wca_test1234567890';
      const hash1 = service.hashApiKey(key);
      const hash2 = service.hashApiKey(key);

      expect(hash1).toEqual(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different keys', () => {
      const hash1 = service.hashApiKey('wca_key1');
      const hash2 = service.hashApiKey('wca_key2');

      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('createApiKey', () => {
    it('should create an API key and return the plain key', async () => {
      const companyId = 'company-123';
      const dto = { name: 'Test Key' };

      mockPrismaService.apiKey.create.mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
        keyPrefix: 'abc12345',
        permissions: { read: true, write: false },
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.createApiKey(companyId, dto);

      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('plainKey');
      expect(result.plainKey).toMatch(/^wca_/);
      expect(result.apiKey.name).toEqual('Test Key');
      expect(mockPrismaService.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId,
          name: 'Test Key',
        }),
      });
    });

    it('should accept custom permissions', async () => {
      const companyId = 'company-123';
      const dto = {
        name: 'Write Key',
        permissions: { read: true, write: true },
      };

      mockPrismaService.apiKey.create.mockResolvedValue({
        id: 'key-456',
        name: 'Write Key',
        keyPrefix: 'def67890',
        permissions: { read: true, write: true },
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.createApiKey(companyId, dto);

      expect(mockPrismaService.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          permissions: expect.any(Object),
        }),
      });
    });
  });

  describe('validateApiKey', () => {
    it('should return null for invalid key format', async () => {
      const result = await service.validateApiKey('invalid_key');
      expect(result).toBeNull();
    });

    it('should return null for empty key', async () => {
      const result = await service.validateApiKey('');
      expect(result).toBeNull();
    });

    it('should return null for non-existent key', async () => {
      mockPrismaService.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validateApiKey('wca_nonexistent123');
      expect(result).toBeNull();
    });

    it('should return null for inactive key', async () => {
      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: 'key-123',
        isActive: false,
        company: {
          members: [{ user: { plan: { name: 'ENTERPRISE' } } }],
        },
      });

      const result = await service.validateApiKey('wca_inactivekey123');
      expect(result).toBeNull();
    });

    it('should return null for expired key', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: 'key-123',
        isActive: true,
        expiresAt: expiredDate,
        company: {
          members: [{ user: { plan: { name: 'ENTERPRISE' } } }],
        },
      });

      const result = await service.validateApiKey('wca_expiredkey123');
      expect(result).toBeNull();
    });

    it('should throw ForbiddenException for non-Enterprise plan', async () => {
      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: 'key-123',
        companyId: 'company-123',
        name: 'Test Key',
        isActive: true,
        expiresAt: null,
        permissions: { read: true, write: false },
        company: {
          members: [{ user: { plan: { name: 'FREE' } } }],
        },
      });

      await expect(
        service.validateApiKey('wca_validkey12345678901234567890123456789012345678901234567890'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return validated key info for valid Enterprise key', async () => {
      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: 'key-123',
        companyId: 'company-123',
        name: 'Enterprise Key',
        isActive: true,
        expiresAt: null,
        permissions: { read: true, write: false },
        company: {
          members: [{ user: { plan: { name: 'ENTERPRISE' } } }],
        },
      });
      mockPrismaService.apiKey.update.mockResolvedValue({});

      const result = await service.validateApiKey('wca_validkey12345678901234567890123456789012345678901234567890');

      expect(result).not.toBeNull();
      expect(result?.id).toEqual('key-123');
      expect(result?.companyId).toEqual('company-123');
    });
  });

  describe('listApiKeys', () => {
    it('should return list of API keys for a company', async () => {
      const mockKeys = [
        {
          id: 'key-1',
          name: 'Key 1',
          keyPrefix: 'abc12345',
          permissions: { read: true, write: false },
          lastUsedAt: null,
          expiresAt: null,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'key-2',
          name: 'Key 2',
          keyPrefix: 'def67890',
          permissions: { read: true, write: true },
          lastUsedAt: new Date(),
          expiresAt: null,
          isActive: true,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.apiKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.listApiKeys('company-123');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.apiKey.findMany).toHaveBeenCalledWith({
        where: { companyId: 'company-123' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('revokeApiKey', () => {
    it('should throw NotFoundException for non-existent key', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue(null);

      await expect(
        service.revokeApiKey('nonexistent', 'company-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should revoke an existing key', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue({
        id: 'key-123',
        isActive: true,
      });
      mockPrismaService.apiKey.update.mockResolvedValue({
        id: 'key-123',
        isActive: false,
      });

      const result = await service.revokeApiKey('key-123', 'company-123');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.apiKey.update).toHaveBeenCalledWith({
        where: { id: 'key-123' },
        data: { isActive: false },
      });
    });
  });

  describe('deleteApiKey', () => {
    it('should throw NotFoundException for non-existent key', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteApiKey('nonexistent', 'company-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should delete an existing key', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue({
        id: 'key-123',
      });
      mockPrismaService.apiKey.delete.mockResolvedValue({
        id: 'key-123',
      });

      await service.deleteApiKey('key-123', 'company-123');

      expect(mockPrismaService.apiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-123' },
      });
    });
  });

  describe('rotateApiKey', () => {
    it('should throw NotFoundException for non-existent key', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue(null);

      await expect(
        service.rotateApiKey('nonexistent', 'company-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rotate an existing key and return new secret', async () => {
      mockPrismaService.apiKey.findFirst.mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
      });
      mockPrismaService.apiKey.update.mockResolvedValue({
        id: 'key-123',
        name: 'Test Key',
        keyPrefix: 'newpref1',
        permissions: { read: true, write: false },
        expiresAt: null,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.rotateApiKey('key-123', 'company-123');

      expect(result).toHaveProperty('plainKey');
      expect(result.plainKey).toMatch(/^wca_/);
      expect(mockPrismaService.apiKey.update).toHaveBeenCalled();
    });
  });

  describe('logUsage', () => {
    it('should create a usage log entry', async () => {
      mockPrismaService.apiUsageLog.create.mockResolvedValue({
        id: 'log-123',
        apiKeyId: 'key-123',
        endpoint: '/api/v1/stores',
        method: 'GET',
        statusCode: 200,
        responseTimeMs: 50,
      });

      await service.logUsage(
        'key-123',
        '/api/v1/stores',
        'GET',
        200,
        50,
        '127.0.0.1',
        'Test Agent',
      );

      expect(mockPrismaService.apiUsageLog.create).toHaveBeenCalledWith({
        data: {
          apiKeyId: 'key-123',
          endpoint: '/api/v1/stores',
          method: 'GET',
          statusCode: 200,
          responseTimeMs: 50,
          ipAddress: '127.0.0.1',
          userAgent: 'Test Agent',
        },
      });
    });
  });
});
