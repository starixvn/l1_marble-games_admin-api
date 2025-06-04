import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GameConfigService } from '../game-config.service';
import { GameConfig } from '../schema/game-config.schema';
import { GameConfigSchemaService } from '../../game-config-schema/game-config-schema.service';

describe('GameConfigService', () => {
  let service: GameConfigService;
  let mockGameConfigModel: any;
  let mockGameConfigSchemaService: any;

  beforeEach(async () => {
    // Arrange
    const mockSelect = jest.fn();
    mockGameConfigModel = {
      findOneAndUpdate: jest.fn().mockReturnValue({
        select: mockSelect
      })
    };

    mockGameConfigSchemaService = {
      validateGameConfigSchema: jest.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameConfigService,
        {
          provide: getModelToken(GameConfig.name),
          useValue: mockGameConfigModel
        },
        {
          provide: GameConfigSchemaService,
          useValue: mockGameConfigSchemaService
        }
      ],
    }).compile();

    service = module.get<GameConfigService>(GameConfigService);
  });

  describe('upsertGameConfig', () => {
    it('should call validateGameConfigSchema and findOneAndUpdate with correct parameters', async () => {
      // Arrange
      const gameId = 123;
      const config = { enabled: true, settings: { maxPlayers: 4 } };
      const mockResult = { gameId: 123, config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(gameId, config);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ gameId, config });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(gameId) },
        { $set: { config } },
        { upsert: true, new: true }
      );
      expect(mockGameConfigModel.findOneAndUpdate().select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockResult);
    });

    it('should handle different config values', async () => {
      // Arrange
      const gameId = 456;
      const config = { enabled: false };
      const mockResult = { gameId: 456, config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(gameId, config);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ gameId, config });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(gameId) },
        { $set: { config } },
        { upsert: true, new: true }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle complex config objects', async () => {
      // Arrange
      const gameId = 789;
      const config = {
        enabled: true,
        settings: {
          maxPlayers: 8,
          timeLimit: 300,
          difficulty: 'hard'
        },
        metadata: {
          version: '1.2.0',
          lastUpdated: new Date()
        }
      };
      const mockResult = { gameId, config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(gameId, config);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ gameId, config });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(gameId) },
        { $set: { config } },
        { upsert: true, new: true }
      );
      expect(mockGameConfigModel.findOneAndUpdate().select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockResult);
    });

    it('should handle empty config object', async () => {
      // Arrange
      const gameId = 999;
      const config = {};
      const mockResult = { gameId, config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(gameId, config);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ gameId, config });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(gameId) },
        { $set: { config } },
        { upsert: true, new: true }
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error when schema validation fails', async () => {
      // Arrange
      const gameId = 123;
      const config = { invalid: 'config' };
      const validationError = new Error('Schema validation failed');
      
      mockGameConfigSchemaService.validateGameConfigSchema.mockRejectedValue(validationError);

      // Act & Assert
      await expect(service.upsertGameConfig(gameId, config)).rejects.toThrow('Schema validation failed');
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ gameId, config });
      expect(mockGameConfigModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });
});
