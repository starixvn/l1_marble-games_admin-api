import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameConfigSchemaService } from '../game-config-schema.service';
import { GameConfigJsonSchema } from '../schema/game-config-schema.schema';
import { AdminLogService } from '../../admin-log/admin-log.service';
import { AdminLogActions } from '../../admin-log/constants';

describe('GameConfigSchemaService', () => {
  let service: GameConfigSchemaService;
  let mockModel: any;
  let mockAdminLogService: any;

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
            music: { type: 'boolean' },
          },
          required: ['sound', 'music'],
        },
      },
      required: ['level', 'difficulty', 'settings'],
    },
    name: 'Test Game Configuration',
    uiSchema: {
      level: { 'ui:widget': 'range' },
      difficulty: { 'ui:widget': 'select' },
      settings: {
        sound: { 'ui:widget': 'checkbox' },
        music: { 'ui:widget': 'checkbox' },
      },
    },
  };

  beforeEach(async () => {
    mockModel = {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      find: jest.fn(),
    };

    mockAdminLogService = {
      createLog: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameConfigSchemaService,
        {
          provide: getModelToken(GameConfigJsonSchema.name),
          useValue: mockModel,
        },
        {
          provide: AdminLogService,
          useValue: mockAdminLogService,
        },
      ],
    }).compile();

    service = module.get<GameConfigSchemaService>(GameConfigSchemaService);
  });

  describe('getGameConfigSchema', () => {
    it('should return game config schema when valid id is provided', async () => {
      // Arrange
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(mockGameConfigSchema),
      };
      mockModel.findById.mockReturnValue(mockReturnValue);

      // Act
      const result = await service.getGameConfigSchema(mockId);

      // Assert
      expect(mockModel.findById).toHaveBeenCalledWith(mockId);
      expect(mockReturnValue.select).toHaveBeenCalledWith('-__v -_id');
      expect(result).toEqual(mockGameConfigSchema);
    });

    it('should throw BadRequestException when invalid ObjectId is provided', async () => {
      // Arrange
      const invalidId = 'invalid-id';

      // Act & Assert
      await expect(service.getGameConfigSchema(invalidId)).rejects.toThrow(
        new BadRequestException(`Invalid ObjectId format: ${invalidId}`),
      );
    });

    it('should throw NotFoundException when schema is not found', async () => {
      // Arrange
      const nonExistentId = '507f1f77bcf86cd799439012';
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(null),
      };
      mockModel.findById.mockReturnValue(mockReturnValue);

      // Act & Assert
      await expect(service.getGameConfigSchema(nonExistentId)).rejects.toThrow(
        new NotFoundException(
          `Game config schema not found for id: ${nonExistentId}`,
        ),
      );
    });
  });

  describe('getAllGameConfigSchemas', () => {
    it('should return all game config schemas', async () => {
      // Arrange
      const mockSchemas = [
        {
          _id: mockId,
          name: 'Schema 1',
          toObject: jest.fn().mockImplementation(({ transform }) => {
            const result = { _id: mockId, name: 'Schema 1' };
            return transform(null, result);
          }),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Schema 2',
          toObject: jest.fn().mockImplementation(({ transform }) => {
            const result = {
              _id: '507f1f77bcf86cd799439012',
              name: 'Schema 2',
            };
            return transform(null, result);
          }),
        },
      ];
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(mockSchemas),
      };
      mockModel.find.mockReturnValue(mockReturnValue);

      // Act
      const result = await service.getAllGameConfigSchemas();

      // Assert
      expect(mockModel.find).toHaveBeenCalled();
      expect(mockReturnValue.select).toHaveBeenCalledWith(
        '-__v -schema -uiSchema',
      );
      expect(result).toEqual([
        { id: mockId, name: 'Schema 1' },
        { id: '507f1f77bcf86cd799439012', name: 'Schema 2' },
      ]);
    });
  });

  describe('upsertGameConfigSchema', () => {
    it('should create new game config schema when no id is provided', async () => {
      // Arrange
      const args = {
        schema: mockGameConfigSchema.schema,
        name: mockGameConfigSchema.name,
        uiSchema: mockGameConfigSchema.uiSchema,
      };

      const expectedResult = {
        ...mockGameConfigSchema,
        id: mockId,
      };
      delete (expectedResult as any)._id;

      const mockSave = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockImplementation((options) => {
          const result = { ...mockGameConfigSchema };
          if (options?.transform) {
            return options.transform(null, result);
          }
          return result;
        }),
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
        toObject: mockToObject,
      }));

      // Replace the model in the service with our mock
      (service as any).gameConfigJsonSchemaModel = mockConstructor;

      // Act
      const result = await service.upsertGameConfigSchema(args);

      // Assert
      expect(mockConstructor).toHaveBeenCalledWith({
        schema: args.schema,
        name: args.name,
        uiSchema: args.uiSchema,
      });
      expect(mockSave).toHaveBeenCalled();
      expect(mockAdminLogService.createLog).toHaveBeenCalledWith({
        author: 'admin',
        resource: 'game-config-schema',
        action: AdminLogActions.INSERT,
        diff: {
          new: expectedResult,
        },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should update existing game config schema when id is provided', async () => {
      // Arrange
      const args = {
        id: mockId,
        schema: mockGameConfigSchema.schema,
        name: 'Updated Display Name',
        uiSchema: mockGameConfigSchema.uiSchema,
      };

      const expectedOld = {
        ...mockGameConfigSchema,
        id: mockId,
      };
      delete (expectedOld as any)._id;
      const expectedNew = {
        ...mockGameConfigSchema,
        name: args.name,
        id: mockId,
      };
      delete (expectedNew as any)._id;

      const oldSchema = {
        ...mockGameConfigSchema,
        toObject: jest.fn().mockImplementation(({ transform }) => {
          const result = { ...mockGameConfigSchema };
          return transform(null, result);
        }),
      };

      const mockDocument = {
        ...mockGameConfigSchema,
        name: args.name,
        toObject: jest.fn().mockImplementation(({ transform }) => {
          const result = { ...mockGameConfigSchema, name: args.name };
          return transform(null, result);
        }),
      };
      const mockReturnValue = {
        select: jest.fn().mockResolvedValue(mockDocument),
      };
      mockModel.findByIdAndUpdate.mockReturnValue(mockReturnValue);
      mockModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(oldSchema),
      });

      // Act
      const result = await service.upsertGameConfigSchema(args);

      // Assert
      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockId,
        {
          schema: args.schema,
          name: args.name,
          uiSchema: args.uiSchema,
        },
        { new: true },
      );
      expect(mockReturnValue.select).toHaveBeenCalledWith('-__v');
      expect(mockAdminLogService.createLog).toHaveBeenCalledWith({
        author: 'admin',
        resource: 'game-config-schema',
        action: AdminLogActions.UPDATE,
        diff: {
          old: expectedOld,
          new: expectedNew,
        },
      });
      expect(result).toEqual(expectedNew);
    });

    it('should throw BadRequestException when invalid ObjectId is provided for update', async () => {
      // Arrange
      const args = {
        id: 'invalid-id',
        schema: mockGameConfigSchema.schema,
        name: mockGameConfigSchema.name,
        uiSchema: mockGameConfigSchema.uiSchema,
      };

      // Act & Assert
      await expect(service.upsertGameConfigSchema(args)).rejects.toThrow(
        new BadRequestException(`Invalid ObjectId format: ${args.id}`),
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
            music: false,
          },
        };
        const args = {
          id: mockId,
          config: validConfig,
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
            music: true,
          },
        };
        const args = {
          id: mockId,
          config: validConfig,
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
            music: false,
          },
        };
        const args = {
          id: mockId,
          config: invalidConfig,
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
            music: false,
          },
        };
        const args = {
          id: mockId,
          config: invalidConfig,
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
            music: false,
          },
        };
        const args = {
          id: mockId,
          config: invalidConfig,
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
            sound: true,
          },
        };
        const args = {
          id: mockId,
          config: invalidConfig,
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
            music: false,
          },
        };
        const args = {
          id: mockId,
          config: invalidConfig,
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
            music: false,
          },
        };
        const args = {
          id: invalidId,
          config,
        };

        // Act & Assert
        await expect(service.validateGameConfigSchema(args)).rejects.toThrow(
          new BadRequestException(`Invalid ObjectId format: ${invalidId}`),
        );
      });
    });

    describe('no schema id provided', () => {
      it('should validate with default schema and throw BadRequestException when config is invalid', async () => {
        // Arrange
        const invalidConfig = {
          level: 5,
          difficulty: 'medium',
        };
        const args = {
          config: invalidConfig,
        };

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });

      it('should validate with default schema for valid game config', async () => {
        // Arrange
        const validConfig = {
          enabled: true,
        };
        const args = {
          config: validConfig,
        };

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).resolves.not.toThrow();
      });

      it('should validate with default schema when id is empty string', async () => {
        // Arrange
        const validConfig = {
          enabled: false,
        };
        const args = {
          id: '',
          config: validConfig,
        };

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).resolves.not.toThrow();
      });

      it('should throw BadRequestException with default schema when required field is missing', async () => {
        // Arrange
        const invalidConfig = {
          someOtherField: 'value',
        };
        const args = {
          config: invalidConfig,
        };

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
      });

      it('should throw BadRequestException with default schema when enabled field has wrong type', async () => {
        // Arrange
        const invalidConfig = {
          enabled: 'true',
        };
        const args = {
          config: invalidConfig,
        };

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(BadRequestException);
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
            music: false,
          },
        };
        const args = {
          id: nonExistentId,
          config,
        };
        mockModel.findById.mockResolvedValue(null);

        // Act
        const act = service.validateGameConfigSchema(args);

        // Assert
        await expect(act).rejects.toThrow(
          new NotFoundException(
            `Game config schema not found for id: ${nonExistentId}`,
          ),
        );
        expect(mockModel.findById).toHaveBeenCalledWith(nonExistentId);
      });
    });
  });
});
