import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ApiLogQueryService, QueryLogsParams } from '../api-log.service';
import { LogRecord } from '../schema/log-record.schema';
import { Model } from 'mongoose';

type MockQueryChain = {
  sort: jest.MockedFunction<() => MockQueryChain>;
  lean: jest.MockedFunction<() => MockQueryChain>;
  then: jest.MockedFunction<
    (callback: (logs: LogRecord[]) => LogRecord[]) => Promise<LogRecord[]>
  >;
};

type TransformedLogRecord = Omit<LogRecord, '_id'> & { id: string };

describe('ApiLogQueryService', () => {
  let service: ApiLogQueryService;
  let logModel: jest.Mocked<Model<LogRecord>>;

  const mockLogModel = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiLogQueryService,
        {
          provide: getModelToken(LogRecord.name),
          useValue: mockLogModel,
        },
      ],
    }).compile();

    service = module.get<ApiLogQueryService>(ApiLogQueryService);
    logModel = module.get(getModelToken(LogRecord.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queryLogs', () => {
    it('should query logs with all parameters provided', async () => {
      const params: QueryLogsParams = {
        operator: 'test-operator',
        endpoint: '/api/test',
        queryParams: 'param1=value1&param2=value2',
        gameId: 123,
        eventId: 456,
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockQueryChain: MockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const expectedQuery = {
        timestamp: {
          $gte: new Date('2025-01-01T00:00:00.000Z'),
          $lte: new Date('2025-01-01T23:59:59.000Z'),
        },
        'user.userId': 'test-operator',
        'request.path': '/api/test',
        'request.query': { param1: 'value1', param2: 'value2' },
        'request.additionalInfo.gameId': 123,
        'request.additionalInfo.eventId': 456,
      };

      const expectedResult: TransformedLogRecord[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          user: { userId: 'test-operator' },
          request: { path: '/api/test' },
          response: { status: 200 },
        },
        {
          id: 'log-id-2',
          timestamp: new Date('2025-01-01T13:00:00.000Z'),
          user: { userId: 'test-operator' },
          request: { path: '/api/test' },
          response: { status: 200 },
        },
      ];

      mockQueryChain.then.mockResolvedValue(expectedResult);
      logModel.find.mockReturnValue(
        mockQueryChain as unknown as ReturnType<typeof logModel.find>,
      );

      const result = await service.queryLogs(params);

      expect(logModel.find).toHaveBeenCalledWith(expectedQuery);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.lean).toHaveBeenCalled();
      expect(mockQueryChain.then).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should query logs with only required parameters', async () => {
      const params: QueryLogsParams = {
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockQueryChain: MockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const expectedQuery = {
        timestamp: {
          $gte: new Date('2025-01-01T00:00:00.000Z'),
          $lte: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const expectedResult: TransformedLogRecord[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          user: { userId: 'operator-1' },
          request: { path: '/api/health' },
          response: { status: 200 },
        },
      ];

      mockQueryChain.then.mockResolvedValue(expectedResult);
      logModel.find.mockReturnValue(
        mockQueryChain as unknown as ReturnType<typeof logModel.find>,
      );

      const result = await service.queryLogs(params);

      expect(logModel.find).toHaveBeenCalledWith(expectedQuery);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.lean).toHaveBeenCalled();
      expect(mockQueryChain.then).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should query logs with partial optional parameters', async () => {
      const params: QueryLogsParams = {
        operator: 'test-operator',
        gameId: 123,
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockQueryChain: MockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const expectedQuery = {
        timestamp: {
          $gte: new Date('2025-01-01T00:00:00.000Z'),
          $lte: new Date('2025-01-01T23:59:59.000Z'),
        },
        'user.userId': 'test-operator',
        'request.additionalInfo.gameId': 123,
      };

      const expectedResult: TransformedLogRecord[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          user: { userId: 'test-operator' },
          request: { additionalInfo: { gameId: 123 } },
          response: { status: 200 },
        },
      ];

      mockQueryChain.then.mockResolvedValue(expectedResult);
      logModel.find.mockReturnValue(
        mockQueryChain as unknown as ReturnType<typeof logModel.find>,
      );

      const result = await service.queryLogs(params);

      expect(logModel.find).toHaveBeenCalledWith(expectedQuery);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.lean).toHaveBeenCalled();
      expect(mockQueryChain.then).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty result from database', async () => {
      const params: QueryLogsParams = {
        operator: 'non-existent-operator',
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockQueryChain: MockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const expectedQuery = {
        timestamp: {
          $gte: new Date('2025-01-01T00:00:00.000Z'),
          $lte: new Date('2025-01-01T23:59:59.000Z'),
        },
        'user.userId': 'non-existent-operator',
      };

      const expectedResult: TransformedLogRecord[] = [];

      mockQueryChain.then.mockResolvedValue(expectedResult);
      logModel.find.mockReturnValue(
        mockQueryChain as unknown as ReturnType<typeof logModel.find>,
      );

      const result = await service.queryLogs(params);

      expect(logModel.find).toHaveBeenCalledWith(expectedQuery);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.lean).toHaveBeenCalled();
      expect(mockQueryChain.then).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle complex query parameters parsing', async () => {
      const params: QueryLogsParams = {
        queryParams: 'page=1&limit=10&filter=active&sort=desc',
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockQueryChain: MockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const expectedQuery = {
        timestamp: {
          $gte: new Date('2025-01-01T00:00:00.000Z'),
          $lte: new Date('2025-01-01T23:59:59.000Z'),
        },
        'request.query': {
          page: '1',
          limit: '10',
          filter: 'active',
          sort: 'desc',
        },
      };

      const expectedResult: TransformedLogRecord[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          request: { query: { page: '1', limit: '10' } },
          response: { status: 200 },
        },
      ];

      mockQueryChain.then.mockResolvedValue(expectedResult);
      logModel.find.mockReturnValue(
        mockQueryChain as unknown as ReturnType<typeof logModel.find>,
      );

      const result = await service.queryLogs(params);

      expect(logModel.find).toHaveBeenCalledWith(expectedQuery);
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.lean).toHaveBeenCalled();
      expect(mockQueryChain.then).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });

    it('should handle database errors', async () => {
      const params: QueryLogsParams = {
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockQueryChain: MockQueryChain = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const mockError = new Error('Database connection failed');

      mockQueryChain.then.mockRejectedValue(mockError);
      logModel.find.mockReturnValue(
        mockQueryChain as unknown as ReturnType<typeof logModel.find>,
      );

      await expect(service.queryLogs(params)).rejects.toThrow(
        'Database connection failed',
      );

      expect(logModel.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date('2025-01-01T00:00:00.000Z'),
          $lte: new Date('2025-01-01T23:59:59.000Z'),
        },
      });
      expect(mockQueryChain.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryChain.lean).toHaveBeenCalled();
      expect(mockQueryChain.then).toHaveBeenCalled();
    });
  });
});
