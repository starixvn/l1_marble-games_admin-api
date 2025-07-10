import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import {
  AdminLogService,
  LogParams,
  AdminQueryLogParams,
} from "../admin-log.service";
import { AdminLogRecord } from "../schema/admin-log-record.schema";
import { ClsService } from "nestjs-cls";

describe("AdminLogService", () => {
  let service: AdminLogService;
  let model: any;
  let clsService: any;

  const mockAdminLogModel = {
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockClsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminLogService,
        {
          provide: getModelToken(AdminLogRecord.name),
          useValue: mockAdminLogModel,
        },
        {
          provide: ClsService,
          useValue: mockClsService,
        },
      ],
    }).compile();

    service = module.get<AdminLogService>(AdminLogService);
    model = module.get(getModelToken(AdminLogRecord.name));
    clsService = module.get(ClsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createLog", () => {
    it("should create a log with all required parameters", async () => {
      // Arrange
      const logParams: LogParams = {
        resource: "operator",
        action: "insert",
      };

      const mockUser = { username: "admin-user" };
      const mockCreatedLog = {
        _id: "log-id-1",
        timestamp: new Date("2025-01-01T12:00:00.000Z"),
        author: "admin-user",
        resource: "operator",
        action: "insert",
        diff: undefined,
      };

      clsService.get.mockReturnValue(mockUser);
      model.create.mockResolvedValue(mockCreatedLog);

      // Act
      const result = await service.createLog(logParams);

      // Assert
      expect(clsService.get).toHaveBeenCalledWith("user");
      expect(model.create).toHaveBeenCalledWith({
        author: "admin-user",
        resource: "operator",
        action: "insert",
        diff: undefined,
      });
      expect(model.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCreatedLog);
    });

    it("should create a log with diff information", async () => {
      // Arrange
      const logParams: LogParams = {
        resource: "game-config",
        action: "update",
        diff: {
          old: { name: "old-config", value: 100 },
          new: { name: "new-config", value: 200 },
        },
      };

      const mockUser = { username: "admin-user" };
      const mockCreatedLog = {
        _id: "log-id-2",
        timestamp: new Date("2025-01-01T12:00:00.000Z"),
        author: "admin-user",
        resource: "game-config",
        action: "update",
        diff: {
          old: { name: "old-config", value: 100 },
          new: { name: "new-config", value: 200 },
        },
      };

      clsService.get.mockReturnValue(mockUser);
      model.create.mockResolvedValue(mockCreatedLog);

      // Act
      const result = await service.createLog(logParams);

      // Assert
      expect(clsService.get).toHaveBeenCalledWith("user");
      expect(model.create).toHaveBeenCalledWith({
        author: "admin-user",
        resource: "game-config",
        action: "update",
        diff: {
          old: { name: "old-config", value: 100 },
          new: { name: "new-config", value: 200 },
        },
      });
      expect(model.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCreatedLog);
    });

    it("should handle case when user is not available in cls", async () => {
      // Arrange
      const logParams: LogParams = {
        resource: "operator",
        action: "insert",
      };

      const mockCreatedLog = {
        _id: "log-id-3",
        timestamp: new Date("2025-01-01T12:00:00.000Z"),
        author: "",
        resource: "operator",
        action: "insert",
        diff: undefined,
      };

      clsService.get.mockReturnValue(null);
      model.create.mockResolvedValue(mockCreatedLog);

      // Act
      const result = await service.createLog(logParams);

      // Assert
      expect(clsService.get).toHaveBeenCalledWith("user");
      expect(model.create).toHaveBeenCalledWith({
        author: "",
        resource: "operator",
        action: "insert",
        diff: undefined,
      });
      expect(model.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCreatedLog);
    });

    it("should propagate database errors", async () => {
      // Arrange
      const logParams: LogParams = {
        resource: "operator",
        action: "insert",
      };

      const mockUser = { username: "admin-user" };
      const mockError = new Error("Database connection failed");

      clsService.get.mockReturnValue(mockUser);
      model.create.mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.createLog(logParams)).rejects.toThrow(
        "Database connection failed",
      );
      expect(clsService.get).toHaveBeenCalledWith("user");
      expect(model.create).toHaveBeenCalledWith({
        author: "admin-user",
        resource: "operator",
        action: "insert",
        diff: undefined,
      });
      expect(model.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("queryLogs", () => {
    it("should query logs with all filter parameters", async () => {
      // Arrange
      const queryParams: AdminQueryLogParams = {
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        author: "admin-user",
        resource: "operator",
        action: "insert",
      };

      const mockQueryBuilder = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const mockLogs = [
        {
          _id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "operator",
          action: "insert",
          diff: { old: null, new: { name: "test" } },
        },
      ];

      const expectedTransformedLogs = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "operator",
          action: "insert",
          diff: { old: null, new: { name: "test" } },
        },
      ];

      model.find.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.then.mockImplementation((callback) =>
        Promise.resolve(callback(mockLogs)),
      );

      // Act
      const result = await service.queryLogs(queryParams);

      // Assert
      expect(model.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date("2025-01-01T00:00:00.000Z"),
          $lte: new Date("2025-01-01T23:59:59.000Z"),
        },
        author: "admin-user",
        resource: "operator",
        action: "insert",
      });
      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("-__v");
      expect(mockQueryBuilder.lean).toHaveBeenCalled();
      expect(result).toEqual(expectedTransformedLogs);
    });

    it("should query logs with only date range filter", async () => {
      // Arrange
      const queryParams: AdminQueryLogParams = {
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
      };

      const mockQueryBuilder = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const mockLogs = [
        {
          _id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "game-config",
          action: "update",
          diff: { old: { name: "old" }, new: { name: "new" } },
        },
        {
          _id: "log-id-2",
          timestamp: new Date("2025-01-01T13:00:00.000Z"),
          author: "admin-user-2",
          resource: "operator",
          action: "delete",
          diff: { old: { id: 123 }, new: null },
        },
      ];

      const expectedTransformedLogs = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "game-config",
          action: "update",
          diff: { old: { name: "old" }, new: { name: "new" } },
        },
        {
          id: "log-id-2",
          timestamp: new Date("2025-01-01T13:00:00.000Z"),
          author: "admin-user-2",
          resource: "operator",
          action: "delete",
          diff: { old: { id: 123 }, new: null },
        },
      ];

      model.find.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.then.mockImplementation((callback) =>
        Promise.resolve(callback(mockLogs)),
      );

      // Act
      const result = await service.queryLogs(queryParams);

      // Assert
      expect(model.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date("2025-01-01T00:00:00.000Z"),
          $lte: new Date("2025-01-01T23:59:59.000Z"),
        },
      });
      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("-__v");
      expect(mockQueryBuilder.lean).toHaveBeenCalled();
      expect(result).toEqual(expectedTransformedLogs);
    });

    it("should query logs with partial filters", async () => {
      // Arrange
      const queryParams: AdminQueryLogParams = {
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        author: "admin-user",
        action: "delete",
      };

      const mockQueryBuilder = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const mockLogs = [
        {
          _id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "game-integration",
          action: "delete",
          diff: { old: { id: 123 }, new: null },
        },
      ];

      const expectedTransformedLogs = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "game-integration",
          action: "delete",
          diff: { old: { id: 123 }, new: null },
        },
      ];

      model.find.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.then.mockImplementation((callback) =>
        Promise.resolve(callback(mockLogs)),
      );

      // Act
      const result = await service.queryLogs(queryParams);

      // Assert
      expect(model.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date("2025-01-01T00:00:00.000Z"),
          $lte: new Date("2025-01-01T23:59:59.000Z"),
        },
        author: "admin-user",
        action: "delete",
      });
      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("-__v");
      expect(mockQueryBuilder.lean).toHaveBeenCalled();
      expect(result).toEqual(expectedTransformedLogs);
    });

    it("should handle empty results", async () => {
      // Arrange
      const queryParams: AdminQueryLogParams = {
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
        author: "non-existent-admin",
      };

      const mockQueryBuilder = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const mockLogs: any[] = [];

      model.find.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.then.mockImplementation((callback) =>
        Promise.resolve(callback(mockLogs)),
      );

      // Act
      const result = await service.queryLogs(queryParams);

      // Assert
      expect(model.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date("2025-01-01T00:00:00.000Z"),
          $lte: new Date("2025-01-01T23:59:59.000Z"),
        },
        author: "non-existent-admin",
      });
      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("-__v");
      expect(mockQueryBuilder.lean).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("should propagate database errors", async () => {
      // Arrange
      const queryParams: AdminQueryLogParams = {
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
      };

      const mockError = new Error("Database connection failed");
      model.find.mockImplementation(() => {
        throw mockError;
      });

      // Act & Assert
      await expect(service.queryLogs(queryParams)).rejects.toThrow(
        "Database connection failed",
      );
      expect(model.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date("2025-01-01T00:00:00.000Z"),
          $lte: new Date("2025-01-01T23:59:59.000Z"),
        },
      });
    });

    it("should transform _id to id in results", async () => {
      // Arrange
      const queryParams: AdminQueryLogParams = {
        dateRange: {
          startDate: new Date("2025-01-01T00:00:00.000Z"),
          endDate: new Date("2025-01-01T23:59:59.000Z"),
        },
      };

      const mockQueryBuilder = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn(),
      };

      const mockLogs = [
        {
          _id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "operator",
          action: "insert",
          diff: { old: null, new: { name: "test" } },
          __v: 0,
        },
      ];

      const expectedTransformedLogs = [
        {
          id: "log-id-1",
          timestamp: new Date("2025-01-01T12:00:00.000Z"),
          author: "admin-user",
          resource: "operator",
          action: "insert",
          diff: { old: null, new: { name: "test" } },
          __v: 0,
        },
      ];

      model.find.mockReturnValue(mockQueryBuilder);
      mockQueryBuilder.then.mockImplementation((callback) =>
        Promise.resolve(callback(mockLogs)),
      );

      // Act
      const result = await service.queryLogs(queryParams);

      // Assert
      expect(model.find).toHaveBeenCalledWith({
        timestamp: {
          $gte: new Date("2025-01-01T00:00:00.000Z"),
          $lte: new Date("2025-01-01T23:59:59.000Z"),
        },
      });
      expect(mockQueryBuilder.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockQueryBuilder.select).toHaveBeenCalledWith("-__v");
      expect(mockQueryBuilder.lean).toHaveBeenCalled();
      expect(result).toEqual(expectedTransformedLogs);
      expect(result[0]).toHaveProperty("id", "log-id-1");
      expect(result[0]).not.toHaveProperty("_id");
    });
  });
});
