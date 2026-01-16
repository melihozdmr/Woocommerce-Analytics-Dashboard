import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../../database/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', () => {
      const result = service.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('environment');
    });
  });

  describe('checkDatabase', () => {
    it('should return connected status when database is available', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await service.checkDatabase();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return error status when database is unavailable', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await service.checkDatabase();

      expect(result).toHaveProperty('status', 'error');
      expect(result).toHaveProperty('database', 'disconnected');
      expect(result).toHaveProperty('error', 'Connection failed');
    });
  });
});
