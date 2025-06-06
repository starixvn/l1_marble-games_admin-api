import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameConfigSchemaService } from '../game-config-schema.service';
import { GameConfigJsonSchema } from '../schema/game-config-schema.schema';

describe('GameConfigSchemaService', () => {
  let service: GameConfigSchemaService;
  let mockModel: any;

  const mockId = '507f1f77bcf86cd799439011';
  const mockGameConfigSchema = {
    _id: mockId,
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
    },
    displayName: 'Test Game Configuration',
    uiSchema: {
      level: { 'ui:widget': 'range' },
      difficulty: { 'ui:widget': 'select' },
      settings: {
        sound: { 'ui:widget': 'checkbox' },
        music: { 'ui:widget': 'checkbox' }
      }
    }
  };

  beforeEach(async () => {
    mockModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
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

  describe('getGameConfigSchema', () => {
    it('should return game config schema when valid id is provided', async () => {
      // Arrange
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(mockGameConfigSchema)
      };
      mockModel.findById.mockReturnValue(mockReturnValue);

      // Act
      const result = await service.getGameConfigSchema(mockId);

      // Assert
      expect(mockModel.findById).toHaveBeenCalledWith(mockId);
      expect(mockReturnValue.select).toHaveBeenCalledWith('-__v');
      expect(result).toEqual(mockGameConfigSchema);
    });

    it('should throw BadRequestException when invalid ObjectId is provided', async () => {
      // Arrange
      const invalidId = 'invalid-id';

      // Act & Assert
      await expect(service.getGameConfigSchema(invalidId)).rejects.toThrow(
        new BadRequestException(`Invalid ObjectId format: ${invalidId}`)
      );
    });

    it('should throw NotFoundException when schema is not found', async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799439012';
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(null)
      };
      mockModel.findById.mockReturnValue(mockReturnValue);

      // Act & Assert
      await expect(service.getGameConfigSchema(nonExistentId)).rejects.toThrow(
        new NotFoundException(`Game config schema not found for id: ${nonExistentId}`)
      );
    });
  });

  describe('getAllGameConfigSchemas', () => {
    it('should return all game config schemas', async () => {
      // Arrange
      const mockSchemas = [
        { _id: mockId, displayName: 'Schema 1' },
        { _id: '507f1f77bcf86cd799439012', displayName: 'Schema 2' }
      ];
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(mockSchemas)
      };
      mockModel.find.mockReturnValue(mockReturnValue);

      // Act
      const result = await service.getAllGameConfigSchemas();

      // Assert
      expect(mockModel.find).toHaveBeenCalled();
      expect(mockReturnValue.select).toHaveBeenCalledWith('-__v -schema -uiSchema');
      expect(result).toEqual(mockSchemas);
    });
  });

  describe('upsertGameConfigSchema', () => {
    it('should create new game config schema when no id is provided', async () => {
      // Arrange
      const args = {
        schema: mockGameConfigSchema.schema,
        displayName: mockGameConfigSchema.displayName,
        uiSchema: mockGameConfigSchema.uiSchema
      };

      const mockSave = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockImplementation((options) => {
          const result = { ...mockGameConfigSchema };
          if (options?.transform) {
            options.transform(null, result);
          }
          return result;
        })
      });
      const mockToObject = jest.fn().mockImplementation((options) => {
        const result = { ...mockGameConfigSchema };
        if (options?.transform) {
          options.transform(null, result);
        }
        return result;
      });

      // Mock the model constructor
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
        toObject: mockToObject
      }));

      // Replace the model in the service with our mock
      (service as any).gameConfigJsonSchemaModel = mockConstructor;

      // Act
      const result = await service.upsertGameConfigSchema(args);

      // Assert
      expect(mockConstructor).toHaveBeenCalledWith({
        schema: args.schema,
        displayName: args.displayName,
        uiSchema: args.uiSchema
      });
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockGameConfigSchema);
    });

    it('should update existing game config schema when id is provided', async () => {
      // Arrange
      const args = {
        id: mockId,
        schema: mockGameConfigSchema.schema,
        displayName: 'Updated Display Name',
        uiSchema: mockGameConfigSchema.uiSchema
      };
      
      const updatedSchema = { ...mockGameConfigSchema, displayName: args.displayName };
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(updatedSchema)
      };
      mockModel.findByIdAndUpdate.mockReturnValue(mockReturnValue);

      // Act
      const result = await service.upsertGameConfigSchema(args);

      // Assert
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        {
          schema: args.schema,
          displayName: args.displayName,
          uiSchema: args.uiSchema
        },
        { new: true }
      );
      expect(mockReturnValue.select).toHaveBeenCalledWith('-__v');
      expect(result).toEqual(updatedSchema);
    });

    it('should throw BadRequestException when invalid ObjectId is provided for update', async () => {
      // Arrange
      const args = {
        id: 'invalid-id',
        schema: mockGameConfigSchema.schema,
        displayName: mockGameConfigSchema.displayName,
        uiSchema: mockGameConfigSchema.uiSchema
      };

      // Act & Assert
      await expect(service.upsertGameConfigSchema(args)).rejects.toThrow(
        new BadRequestException(`Invalid ObjectId format: ${args.id}`)
      );
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
          id: mockId,
          config: validConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).resolves.not.toThrow();
        expect(mockModel.findById).toHaveBeenCalledWith(mockId);
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
          id: mockId,
          config: validConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

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
          id: mockId,
          config: invalidConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

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
          id: mockId,
          config: invalidConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

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
          id: mockId,
          config: invalidConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

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
          id: mockId,
          config: invalidConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

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
          id: mockId,
          config: invalidConfig
        };
        mockModel.findById.mockResolvedValue(mockGameConfigSchema);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });
    });

    describe('invalid ObjectId', () => {
      it('should throw BadRequestException when invalid ObjectId is provided', async () => {
        // Arrange
        const invalidId = 'invalid-id';
        const config = {
          level: 5,
          difficulty: 'medium',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          id: invalidId,
          config
        };

        // Act & Assert
        await expect(service.validateGameConfigSchema(args)).rejects.toThrow(
          new BadRequestException(`Invalid ObjectId format: ${invalidId}`)
        );
      });
    });

    describe('no schema found', () => {
      it('should throw NotFoundException when schema does not exist for id', async () => {
        // Arrange
        const nonExistentId = '507f1f77bcf86cd799439012';
        const config = {
          level: 5,
          difficulty: 'medium',
          settings: {
            sound: true,
            music: false
          }
        };
        const args = {
          id: nonExistentId,
          config
        };
        mockModel.findById.mockResolvedValue(null);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(
          new NotFoundException(`Game config schema not found for id: ${nonExistentId}`)
        );
        expect(mockModel.findById).toHaveBeenCalledWith(nonExistentId);
      });
    });
  });
});
