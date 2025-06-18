import { Test, TestingModule } from '@nestjs/testing';
import { HealthcheckService } from '../healthcheck.service';
import { ServiceUnavailableException } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

describe('HealthcheckService', () => {
  let service: HealthcheckService;
  let mongoConnection: {
    readyState: number;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthcheckService,
        {
          provide: getConnectionToken(),
          useValue: {
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
    it('should return health status only when database is fully connected', async () => {
      // arrange
      process.env.ENVIRONMENT = 'test';
      const expectedResponse = {
        messge: 'API is running in test environment',
        timestamp: expect.any(String),
      };

      // act
      const result = await service.healthCheck();

      // assert
      expect(result).toEqual(expectedResponse);
    });

    it('should throw ServiceUnavailableException when database is disconnected', async () => {
      // arrange
      process.env.ENVIRONMENT = 'test';
      mongoConnection.readyState = 0;
      const expectedError = {
        message: 'API is running but database is unavailable, test environment',
        timestamp: expect.any(String),
        database: {
          error: 'DB not ready',
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
    });

    it('should throw ServiceUnavailableException when database is connecting', async () => {
      // arrange
      process.env.ENVIRONMENT = 'test';
      mongoConnection.readyState = 2;
      const expectedError = {
        message: 'API is running but database is unavailable, test environment',
        timestamp: expect.any(String),
        database: {
          error: 'DB not ready',
          state: 'connecting',
        },
      };

      // act
      const result = service.healthCheck();

      // assert
      await expect(result).rejects.toThrow(ServiceUnavailableException);
      await expect(result).rejects.toMatchObject({
        response: expectedError
      });
    });

    it('should throw ServiceUnavailableException when database is disconnecting', async () => {
      // arrange
      process.env.ENVIRONMENT = 'test';
      mongoConnection.readyState = 3;
      const expectedError = {
        message: 'API is running but database is unavailable, test environment',
        timestamp: expect.any(String),
        database: {
          error: 'DB not ready',
          state: 'disconnecting',
        },
      };

      // act
      const result = service.healthCheck();

      // assert
      await expect(result).rejects.toThrow(ServiceUnavailableException);
      await expect(result).rejects.toMatchObject({
        response: expectedError
      });
    });
  });
});
