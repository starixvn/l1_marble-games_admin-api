import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameConfigSchemaService } from '../game-config-schema.service';
import { GameConfigJsonSchema } from '../schema/game-config-schema.schema';

describe('GameConfigSchemaService', () => {
  let service: GameConfigSchemaService;
  let mockModel: any;

  const mockGameConfigSchema = {
    gameId: 1,
    schema: {
      type: 'object',
      properties: {
        level: { type: 'number', minimum: 1, maximum: 100 },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        settings: {
          type: 'object',
          properties: {
            sound: { type: 'boolean' },
            music: { type: 'boolean' }
          },
          required: ['sound', 'music']
        }
      },
      required: ['level', 'difficulty', 'settings']
    }
  };

  beforeEach(async () => {
    mockModel = {
      findOneAndUpdate: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameConfigSchemaService,
        {
          provide: getModelToken(GameConfigJsonSchema.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<GameConfigSchemaService>(GameConfigSchemaService);
  });

  describe('upsertGameConfigSchema', () => {
    it('should create new game config schema', async () => {
      // Arrange
      const args = {
        gameId: 1,
        schema: mockGameConfigSchema.schema
      };
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(mockGameConfigSchema)
      };
      mockModel.findOneAndUpdate.mockReturnValue(mockReturnValue);

      // Act
      const act = service.upsertGameConfigSchema(args);

      // Assert
      const result = await act;
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: 1 },
        { schema: mockGameConfigSchema.schema },
        { upsert: true, new: true }
      );
      expect(mockReturnValue.select).toHaveBeenCalledWith('-_id -__v');
      expect(result).toEqual(mockGameConfigSchema);
    });

    it('should update existing game config schema', async () => {
      // Arrange
      const args = {
        gameId: 2,
        schema: {
          type: 'object',
          properties: {
            score: { type: 'number' }
          }
        }
      };
      const updatedSchema = { gameId: 2, schema: args.schema };
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(updatedSchema)
      };
      mockModel.findOneAndUpdate.mockReturnValue(mockReturnValue);

      // Act
      const act = service.upsertGameConfigSchema(args);

      // Assert
      const result = await act;
      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { gameId: 2 },
        { schema: args.schema },
        { upsert: true, new: true }
      );
      expect(result).toEqual(updatedSchema);
    });
  });

  describe('validateGameConfigSchema', () => {
    describe('valid config object', () => {
      it('should validate config successfully when schema exists and config is valid', async () => {
        // Arrange
        const validConfig = {
          level: 5,
          difficulty: 'medium',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          gameId: 1,
          config: validConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).resolves.not.toThrow();
        expect(mockModel.findOne).toHaveBeenCalledWith({ gameId: 1 });
      });

      it('should validate config with different valid values', async () => {
        // Arrange
        const validConfig = {
          level: 100,
          difficulty: 'hard',
          settings: {
            sound: false,
            music: true
          }
        };
        const args = {
          gameId: 1,
          config: validConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).resolves.not.toThrow();
      });
    });

    describe('invalid config object', () => {
      it('should throw BadRequestException when level is out of range', async () => {
        // Arrange
        const invalidConfig = {
          level: 150,
          difficulty: 'medium',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          gameId: 1,
          config: invalidConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when difficulty has invalid value', async () => {
        // Arrange
        const invalidConfig = {
          level: 5,
          difficulty: 'extreme',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          gameId: 1,
          config: invalidConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when required field is missing', async () => {
        // Arrange
        const invalidConfig = {
          level: 5,
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          gameId: 1,
          config: invalidConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when nested required field is missing', async () => {
        // Arrange
        const invalidConfig = {
          level: 5,
          difficulty: 'easy',
          settings: {
            sound: true
          }
        };
        const args = {
          gameId: 1,
          config: invalidConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException when field has wrong type', async () => {
        // Arrange
        const invalidConfig = {
          level: '5',
          difficulty: 'medium',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          gameId: 1,
          config: invalidConfig
        };
        mockModel.findOne.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });
    });

    describe('no schema found', () => {
      it('should throw NotFoundException when schema does not exist for gameId', async () => {
        // Arrange
        const config = {
          level: 5,
          difficulty: 'medium',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          gameId: 999,
          config
        };
        mockModel.findOne.mockResolvedValue(null);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(
          new NotFoundException('Game config schema not found for gameId: 999')
        );
        expect(mockModel.findOne).toHaveBeenCalledWith({ gameId: 999 });
      });
    });
  });
});
