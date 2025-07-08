import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { GameConfigService } from "../game-config.service";
import { GameConfig, GameConfigDocument } from "../schema/game-config.schema";
import { GameConfigSchemaService } from "../../game-config-schema/game-config-schema.service";
import { AdminLogService } from "../../admin-log/admin-log.service";
import { Model } from "mongoose";

describe("GameConfigService", () => {
  let service: GameConfigService;
  let mockGameConfigModel: Partial<Model<GameConfigDocument>>;
  let mockGameConfigSchemaService: Partial<GameConfigSchemaService>;
  let mockAdminLogService: Partial<AdminLogService>;

  const mockSchemaId = "507f1f77bcf86cd799439011";

  beforeEach(async () => {
    // Arrange
    const mockSelect = jest.fn();
    const mockFindOneAndUpdate = jest.fn().mockReturnValue({
      select: mockSelect,
    });
    const mockFindOne = jest.fn().mockReturnValue({
      select: jest.fn(),
    });
    const mockFind = jest.fn().mockReturnValue({
      select: jest.fn(),
    });

    mockGameConfigModel = {
      findOneAndUpdate: mockFindOneAndUpdate,
      findOne: mockFindOne,
      find: mockFind,
    };

    mockGameConfigSchemaService = {
      validateGameConfigSchema: jest.fn().mockResolvedValue(undefined),
    };

    mockAdminLogService = {
      createLog: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameConfigService,
        {
          provide: getModelToken(GameConfig.name),
          useValue: mockGameConfigModel,
        },
        {
          provide: GameConfigSchemaService,
          useValue: mockGameConfigSchemaService,
        },
        {
          provide: AdminLogService,
          useValue: mockAdminLogService,
        },
      ],
    }).compile();

    service = module.get<GameConfigService>(GameConfigService);
  });

  describe("upsertGameConfig", () => {
    it("should call validateGameConfigSchema and findOneAndUpdate with correct parameters", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 123,
        config: { enabled: true, settings: { maxPlayers: 4 } },
      };
      const mockResult = { gameId: 123, config: args.config };

      const mockFindOneAndUpdateFn =
        mockGameConfigModel.findOneAndUpdate as jest.Mock;
      mockFindOneAndUpdateFn().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(
        mockGameConfigSchemaService.validateGameConfigSchema,
      ).toHaveBeenCalledWith({
        id: mockSchemaId,
        config: args.config,
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        {
          $set: {
            config: args.config,
            gameConfigSchema: mockSchemaId,
          },
        },
        { upsert: true, new: true },
      );
      expect(mockFindOneAndUpdateFn().select).toHaveBeenCalledWith("-_id -__v");
      expect(result).toEqual(mockResult);
    });

    it("should handle different config values", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 456,
        config: { enabled: false },
      };
      const mockResult = { gameId: 456, config: args.config };

      const mockFindOneAndUpdateFn =
        mockGameConfigModel.findOneAndUpdate as jest.Mock;
      mockFindOneAndUpdateFn().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(
        mockGameConfigSchemaService.validateGameConfigSchema,
      ).toHaveBeenCalledWith({
        id: mockSchemaId,
        config: args.config,
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        {
          $set: {
            config: args.config,
            gameConfigSchema: mockSchemaId,
          },
        },
        { upsert: true, new: true },
      );
      expect(result).toEqual(mockResult);
    });

    it("should handle complex config objects", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 789,
        config: {
          enabled: true,
          settings: {
            maxPlayers: 8,
            timeLimit: 300,
            difficulty: "hard",
          },
          metadata: {
            version: "1.2.0",
            lastUpdated: new Date(),
          },
        },
      };
      const mockResult = { gameId: args.gameId, config: args.config };

      const mockFindOneAndUpdateFn =
        mockGameConfigModel.findOneAndUpdate as jest.Mock;
      mockFindOneAndUpdateFn().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(
        mockGameConfigSchemaService.validateGameConfigSchema,
      ).toHaveBeenCalledWith({
        id: mockSchemaId,
        config: args.config,
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        {
          $set: {
            config: args.config,
            gameConfigSchema: mockSchemaId,
          },
        },
        { upsert: true, new: true },
      );
      expect(mockFindOneAndUpdateFn().select).toHaveBeenCalledWith("-_id -__v");
      expect(result).toEqual(mockResult);
    });

    it("should handle empty config object", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 999,
        config: {},
      };
      const mockResult = { gameId: args.gameId, config: args.config };

      const mockFindOneAndUpdateFn =
        mockGameConfigModel.findOneAndUpdate as jest.Mock;
      mockFindOneAndUpdateFn().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(
        mockGameConfigSchemaService.validateGameConfigSchema,
      ).toHaveBeenCalledWith({
        id: mockSchemaId,
        config: args.config,
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        {
          $set: {
            config: args.config,
            gameConfigSchema: mockSchemaId,
          },
        },
        { upsert: true, new: true },
      );
      expect(result).toEqual(mockResult);
    });

    it("should throw error when schema validation fails", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 123,
        config: { invalid: "config" },
      };
      const validationError = new Error("Schema validation failed");

      const mockValidateFn =
        mockGameConfigSchemaService.validateGameConfigSchema as jest.Mock;
      mockValidateFn.mockRejectedValue(validationError);

      // Act & Assert
      await expect(service.upsertGameConfig(args)).rejects.toThrow(
        "Schema validation failed",
      );
      expect(
        mockGameConfigSchemaService.validateGameConfigSchema,
      ).toHaveBeenCalledWith({
        id: mockSchemaId,
        config: args.config,
      });
      expect(mockGameConfigModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should create admin log when upserting game config", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 123,
        config: { enabled: true },
      };
      const mockResult = { gameId: 123, config: args.config };

      const mockFindOneAndUpdateFn =
        mockGameConfigModel.findOneAndUpdate as jest.Mock;
      mockFindOneAndUpdateFn().select.mockResolvedValue(mockResult);

      // Act
      await service.upsertGameConfig(args);

      // Assert
      expect(mockAdminLogService.createLog).toHaveBeenCalledWith({
        author: "admin",
        resource: "game-config",
        action: "insert",
        diff: {
          old: undefined,
          new: mockResult,
        },
      });
    });

    it("should create admin log with update action when existing config is found", async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 123,
        config: { enabled: true },
      };
      const oldConfig = {
        gameId: 123,
        config: { enabled: false },
        toObject: () => ({ gameId: 123, config: { enabled: false } }),
      };
      const mockResult = { gameId: 123, config: args.config };

      const mockFindOneFn = mockGameConfigModel.findOne as jest.Mock;
      const mockFindOneAndUpdateFn =
        mockGameConfigModel.findOneAndUpdate as jest.Mock;

      mockFindOneFn().select.mockResolvedValue(oldConfig);
      mockFindOneAndUpdateFn().select.mockResolvedValue(mockResult);

      // Act
      await service.upsertGameConfig(args);

      // Assert
      expect(mockAdminLogService.createLog).toHaveBeenCalledWith({
        author: "admin",
        resource: "game-config",
        action: "update",
        diff: {
          old: { gameId: 123, config: { enabled: false } },
          new: mockResult,
        },
      });
    });
  });

  describe("getGameConfigByGameId", () => {
    it("should return game config for given gameId", async () => {
      // Arrange
      const gameId = 123;
      const mockResult = { gameId, config: { enabled: true } };
      const mockFindOneFn = mockGameConfigModel.findOne as jest.Mock;
      mockFindOneFn().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.getGameConfigByGameId(gameId);

      // Assert
      expect(mockGameConfigModel.findOne).toHaveBeenCalledWith({
        gameId: Number(gameId),
      });
      expect(mockFindOneFn().select).toHaveBeenCalledWith("-_id -__v");
      expect(result).toEqual(mockResult);
    });
  });

  describe("getAllGameConfigs", () => {
    it("should return all game configs", async () => {
      // Arrange
      const mockResult = [
        { gameId: 123, config: { enabled: true } },
        { gameId: 456, config: { enabled: false } },
      ];
      const mockFindFn = mockGameConfigModel.find as jest.Mock;
      mockFindFn().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.getAllGameConfigs();

      // Assert
      expect(mockGameConfigModel.find).toHaveBeenCalled();
      expect(mockFindFn().select).toHaveBeenCalledWith("-_id -__v");
      expect(result).toEqual(mockResult);
    });
  });
});
