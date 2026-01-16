import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let service: HealthService;

  const mockHealthService = {
    check: jest.fn(),
    checkDatabase: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status', () => {
      const expectedResult = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: 100,
        environment: 'test',
      };
      mockHealthService.check.mockReturnValue(expectedResult);

      const result = controller.check();

      expect(result).toEqual(expectedResult);
      expect(mockHealthService.check).toHaveBeenCalled();
    });
  });

  describe('checkDatabase', () => {
    it('should return database health status', async () => {
      const expectedResult = {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
      mockHealthService.checkDatabase.mockResolvedValue(expectedResult);

      const result = await controller.checkDatabase();

      expect(result).toEqual(expectedResult);
      expect(mockHealthService.checkDatabase).toHaveBeenCalled();
    });
  });
});
