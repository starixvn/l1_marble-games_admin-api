import { Test, TestingModule } from '@nestjs/testing';
import { AdminLogController } from '../admin-log.controller';
import { AdminLogService } from '../admin-log.service';
import { AdminLogQueryDto } from '../dto/admin-log-query.dto';

describe('AdminLogController', () => {
  let controller: AdminLogController;
  let service: jest.Mocked<AdminLogService>;

  const mockAdminLogService = {
    queryLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminLogController],
      providers: [
        {
          provide: AdminLogService,
          useValue: mockAdminLogService,
        },
      ],
    }).compile();

    controller = module.get<AdminLogController>(AdminLogController);
    service = module.get(AdminLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    it('should call service with correct parameters when all query params are provided', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
        author: 'admin-user',
        resource: 'operator',
        action: 'insert',
      };

      const expectedServiceParams = {
        author: 'admin-user',
        resource: 'operator',
        action: 'insert',
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockServiceResponse: any[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          author: 'admin-user',
          resource: 'operator',
          action: 'insert',
          diff: { before: {}, after: { name: 'test' } },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getLogs(queryDto);

      // Assert
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should call service with only required parameters when optional params are not provided', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
      };

      const expectedServiceParams = {
        author: undefined,
        resource: undefined,
        action: undefined,
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockServiceResponse: any[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          author: 'admin-user',
          resource: 'game-config',
          action: 'update',
          diff: { before: { name: 'old' }, after: { name: 'new' } },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getLogs(queryDto);

      // Assert
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should call service with partial optional parameters', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
        author: 'admin-user',
        action: 'delete',
      };

      const expectedServiceParams = {
        author: 'admin-user',
        resource: undefined,
        action: 'delete',
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockServiceResponse: any[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          author: 'admin-user',
          resource: 'game-integration',
          action: 'delete',
          diff: { before: { id: 123 }, after: null },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getLogs(queryDto);

      // Assert
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should call service with different resource types', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
        resource: 'game-config-schema',
        action: 'update',
      };

      const expectedServiceParams = {
        author: undefined,
        resource: 'game-config-schema',
        action: 'update',
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockServiceResponse: any[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          author: 'admin-user',
          resource: 'game-config-schema',
          action: 'update',
          diff: { before: { schema: 'old' }, after: { schema: 'new' } },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getLogs(queryDto);

      // Assert
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle empty response from service', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
        author: 'non-existent-admin',
      };

      const expectedServiceParams = {
        author: 'non-existent-admin',
        resource: undefined,
        action: undefined,
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockServiceResponse: any[] = [];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getLogs(queryDto);

      // Assert
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it('should propagate service errors', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
      };

      const expectedServiceParams = {
        author: undefined,
        resource: undefined,
        action: undefined,
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockError = new Error('Database connection failed');
      queryLogsMock.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.getLogs(queryDto)).rejects.toThrow(
        'Database connection failed',
      );
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
    });

    it('should call service with all action types', async () => {
      // Arrange
      const queryLogsMock = service.queryLogs;
      const queryDto: AdminLogQueryDto = {
        startDate: '2025-01-01T00:00:00.000Z',
        endDate: '2025-01-01T23:59:59.000Z',
        action: 'insert',
      };

      const expectedServiceParams = {
        author: undefined,
        resource: undefined,
        action: 'insert',
        dateRange: {
          startDate: new Date('2025-01-01T00:00:00.000Z'),
          endDate: new Date('2025-01-01T23:59:59.000Z'),
        },
      };

      const mockServiceResponse: any[] = [
        {
          id: 'log-id-1',
          timestamp: new Date('2025-01-01T12:00:00.000Z'),
          author: 'admin-user',
          resource: 'operator',
          action: 'insert',
          diff: { before: null, after: { name: 'new-operator' } },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getLogs(queryDto);

      // Assert
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });
  });
});
