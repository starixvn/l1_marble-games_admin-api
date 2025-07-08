import { Test, TestingModule } from "@nestjs/testing";
import { ApiLogController } from "../api-log.controller";
import { ApiLogQueryService } from "../api-log.service";
import { ApiLogQueryDto } from "../dto/log-query.dto";

describe("ApiLogController", () => {
  let controller: ApiLogController;
  let service: jest.Mocked<ApiLogQueryService>;

  const mockApiLogQueryService = {
    queryLogs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiLogController],
      providers: [
        {
          provide: ApiLogQueryService,
          useValue: mockApiLogQueryService,
        },
      ],
    }).compile();

    controller = module.get<ApiLogController>(ApiLogController);
    service = module.get(ApiLogQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getLogs", () => {
    it("should call service with correct parameters when all query params are provided", async () => {
      const queryLogsMock = service.queryLogs;
      const queryDto: ApiLogQueryDto = {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-01T23:59:59.000Z",
        operator: "test-operator",
        endpoint: "/api/test",
        queryParams: "param1=value1&param2=value2",
        gameId: 123,
        eventId: 456,
      };

      const expectedServiceParams = {
        operator: "test-operator",
        endpoint: "/api/test",
        queryParams: "param1=value1&param2=value2",
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        gameId: 123,
        eventId: 456,
      };

      const mockServiceResponse: any[] = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          user: { userId: "test-operator" },
          request: { path: "/api/test" },
          response: { status: 200 },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLogs(queryDto);

      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it("should call service with only required parameters when optional params are not provided", async () => {
      const queryLogsMock = service.queryLogs;
      const queryDto: ApiLogQueryDto = {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-01T23:59:59.000Z",
      };

      const expectedServiceParams = {
        operator: undefined,
        endpoint: undefined,
        queryParams: undefined,
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        gameId: undefined,
        eventId: undefined,
      };

      const mockServiceResponse: any[] = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          user: { userId: "operator-1" },
          request: { path: "/api/health" },
          response: { status: 200 },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLogs(queryDto);

      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it("should call service with partial optional parameters", async () => {
      const queryLogsMock = service.queryLogs;
      const queryDto: ApiLogQueryDto = {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-01T23:59:59.000Z",
        operator: "test-operator",
        gameId: 123,
      };

      const expectedServiceParams = {
        operator: "test-operator",
        endpoint: undefined,
        queryParams: undefined,
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        gameId: 123,
        eventId: undefined,
      };

      const mockServiceResponse: any[] = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          user: { userId: "test-operator" },
          request: { additionalInfo: { gameId: 123 } },
          response: { status: 200 },
        },
      ];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLogs(queryDto);

      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it("should handle empty response from service", async () => {
      const queryLogsMock = service.queryLogs;
      const queryDto: ApiLogQueryDto = {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-01T23:59:59.000Z",
        operator: "non-existent-operator",
      };

      const expectedServiceParams = {
        operator: "non-existent-operator",
        endpoint: undefined,
        queryParams: undefined,
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        gameId: undefined,
        eventId: undefined,
      };

      const mockServiceResponse: any[] = [];

      queryLogsMock.mockResolvedValue(mockServiceResponse);

      const result = await controller.getLogs(queryDto);

      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockServiceResponse);
    });

    it("should propagate service errors", async () => {
      const queryLogsMock = service.queryLogs;
      const queryDto: ApiLogQueryDto = {
        startDate: "2025-01-01T00:00:00.000Z",
        endDate: "2025-01-01T23:59:59.000Z",
      };

      const expectedServiceParams = {
        operator: undefined,
        endpoint: undefined,
        queryParams: undefined,
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        gameId: undefined,
        eventId: undefined,
      };

      const mockError = new Error("Database connection failed");
      queryLogsMock.mockRejectedValue(mockError);

      await expect(controller.getLogs(queryDto)).rejects.toThrow(
        "Database connection failed",
      );
      expect(queryLogsMock).toHaveBeenCalledWith(expectedServiceParams);
      expect(queryLogsMock).toHaveBeenCalledTimes(1);
    });
  });
});
