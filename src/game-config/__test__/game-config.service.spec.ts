import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GameConfigService } from '../game-config.service';
import { GameConfig } from '../schema/game-config.schema';
import { GameConfigSchemaService } from '../../game-config-schema/game-config-schema.service';
import { Types } from 'mongoose';

describe('GameConfigService', () => {
  let service: GameConfigService;
  let mockGameConfigModel: any;
  let mockGameConfigSchemaService: any;

  const mockSchemaId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    // Arrange
    const mockSelect = jest.fn();
    mockGameConfigModel = {
      findOneAndUpdate: jest.fn().mockReturnValue({
        select: mockSelect
      }),
      findOne: jest.fn().mockReturnValue({
        select: jest.fn()
      }),
      find: jest.fn().mockReturnValue({
        select: jest.fn()
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
      const args = {
        schemaId: mockSchemaId,
        gameId: 123,
        config: { enabled: true, settings: { maxPlayers: 4 } }
      };
      const mockResult = { gameId: 123, config: args.config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ 
        id: mockSchemaId, 
        config: args.config 
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        { 
          $set: { 
            config: args.config,
            gameConfigSchema: new Types.ObjectId(mockSchemaId)
          } 
        },
        { upsert: true, new: true }
      );
      expect(mockGameConfigModel.findOneAndUpdate().select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockResult);
    });

    it('should handle different config values', async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 456,
        config: { enabled: false }
      };
      const mockResult = { gameId: 456, config: args.config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ 
        id: mockSchemaId, 
        config: args.config 
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        { 
          $set: { 
            config: args.config,
            gameConfigSchema: new Types.ObjectId(mockSchemaId)
          } 
        },
        { upsert: true, new: true }
      );
      expect(result).toEqual(mockResult);
    });

    it('should handle complex config objects', async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 789,
        config: {
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
        }
      };
      const mockResult = { gameId: args.gameId, config: args.config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ 
        id: mockSchemaId, 
        config: args.config 
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        { 
          $set: { 
            config: args.config,
            gameConfigSchema: new Types.ObjectId(mockSchemaId)
          } 
        },
        { upsert: true, new: true }
      );
      expect(mockGameConfigModel.findOneAndUpdate().select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockResult);
    });

    it('should handle empty config object', async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 999,
        config: {}
      };
      const mockResult = { gameId: args.gameId, config: args.config };
      
      mockGameConfigModel.findOneAndUpdate().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.upsertGameConfig(args);

      // Assert
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ 
        id: mockSchemaId, 
        config: args.config 
      });
      expect(mockGameConfigModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: Number(args.gameId) },
        { 
          $set: { 
            config: args.config,
            gameConfigSchema: new Types.ObjectId(mockSchemaId)
          } 
        },
        { upsert: true, new: true }
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw error when schema validation fails', async () => {
      // Arrange
      const args = {
        schemaId: mockSchemaId,
        gameId: 123,
        config: { invalid: 'config' }
      };
      const validationError = new Error('Schema validation failed');
      
      mockGameConfigSchemaService.validateGameConfigSchema.mockRejectedValue(validationError);

      // Act & Assert
      await expect(service.upsertGameConfig(args)).rejects.toThrow('Schema validation failed');
      expect(mockGameConfigSchemaService.validateGameConfigSchema).toHaveBeenCalledWith({ 
        id: mockSchemaId, 
        config: args.config 
      });
      expect(mockGameConfigModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('getGameConfigByGameId', () => {
    it('should return game config for given gameId', async () => {
      // Arrange
      const gameId = 123;
      const mockResult = { gameId, config: { enabled: true } };
      mockGameConfigModel.findOne().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.getGameConfigByGameId(gameId);

      // Assert
      expect(mockGameConfigModel.findOne).toHaveBeenCalledWith({ gameId: Number(gameId) });
      expect(mockGameConfigModel.findOne().select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getAllGameConfigs', () => {
    it('should return all game configs', async () => {
      // Arrange
      const mockResult = [
        { gameId: 123, config: { enabled: true } },
        { gameId: 456, config: { enabled: false } }
      ];
      mockGameConfigModel.find().select.mockResolvedValue(mockResult);

      // Act
      const result = await service.getAllGameConfigs();

      // Assert
      expect(mockGameConfigModel.find).toHaveBeenCalled();
      expect(mockGameConfigModel.find().select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockResult);
    });
  });
});
