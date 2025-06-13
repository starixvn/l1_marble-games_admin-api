import { Test, TestingModule } from '@nestjs/testing';
import { HealthcheckService } from '../healthcheck.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

describe('HealthcheckService', () => {
  let service: HealthcheckService;
  let mongoConnection: {
    db: {
      admin: jest.Mock;
    };
    readyState: number;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthcheckService,
        {
          provide: getConnectionToken(),
          useValue: {
            db: {
              admin: jest.fn(),
            },
            readyState: 1,
          },
        },
      ],
    }).compile();

    service = module.get<HealthcheckService>(HealthcheckService);
    mongoConnection = module.get(getConnectionToken());
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return health status when database is connected', async () => {
      // arrange
      const mockPing = jest.fn().mockResolvedValue({});
      mongoConnection.db.admin = jest.fn().mockReturnValue({ ping: mockPing });
      process.env.ENVIRONMENT = 'test';
      const expectedResponse = {
        messge: 'API is running in test environment',
        timestamp: expect.any(String),
      };

      // act
      const result = await service.healthCheck();

      // assert
      expect(result).toEqual(expectedResponse);
      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    it('should throw ServiceUnavailableException when database ping fails', async () => {
      // arrange
      const mockPing = jest.fn().mockRejectedValue(new Error('Connection failed'));
      mongoConnection.db.admin = jest.fn().mockReturnValue({ ping: mockPing });
      process.env.ENVIRONMENT = 'test';
      mongoConnection.readyState = 0;
      const expectedError = {
        message: 'API is running but database is unavailable, test environment',
        timestamp: expect.any(String),
        database: {
          error: 'DB down',
          state: 'disconnected',
        },
      };

      // act
      const result = service.healthCheck();

      // assert
      await expect(result).rejects.toThrow(ServiceUnavailableException);
      await expect(result).rejects.toMatchObject({
        response: expectedError
      });
      expect(mockPing).toHaveBeenCalledTimes(1);
    });

    it('should handle unknown database state', async () => {
      // arrange
      const mockPing = jest.fn().mockRejectedValue(new Error('Connection failed'));
      mongoConnection.db.admin = jest.fn().mockReturnValue({ ping: mockPing });
      process.env.ENVIRONMENT = 'test';
      mongoConnection.readyState = 999;
      const expectedError = {
        message: 'API is running but database is unavailable, test environment',
        timestamp: expect.any(String),
        database: {
          error: 'DB down',
          state: 'unknown',
        },
      };

      // act
      const result = service.healthCheck();

      // assert
      await expect(result).rejects.toThrow(ServiceUnavailableException);
      await expect(result).rejects.toMatchObject({
        response: expectedError
      });
      expect(mockPing).toHaveBeenCalledTimes(1);
    });
  });
});
