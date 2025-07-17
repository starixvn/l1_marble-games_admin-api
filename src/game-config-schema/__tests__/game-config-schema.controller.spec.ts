import { Test, TestingModule } from '@nestjs/testing';
import { GameConfigSchemaController } from '../game-config-schema.controller';
import { GameConfigSchemaService } from '../game-config-schema.service';
import { GameConfigSchemaUpsertRequestDto } from '../../game-config/dto/game-config-schema.dto';

describe('GameConfigSchemaController', () => {
  let controller: GameConfigSchemaController;
  let service: GameConfigSchemaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameConfigSchemaController],
      providers: [
        {
          provide: GameConfigSchemaService,
          useValue: {
            upsertGameConfigSchema: jest.fn(),
            getGameConfigSchema: jest.fn(),
            getAllGameConfigSchemas: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<GameConfigSchemaController>(GameConfigSchemaController);
    service = module.get<GameConfigSchemaService>(GameConfigSchemaService);
  });

  describe('upsertSchema', () => {
    it('should call service with correct parameters when creating new schema', async () => {
      // Arrange
      const body: GameConfigSchemaUpsertRequestDto = {
        schema: { type: 'object', properties: { name: { type: 'string' } } },
        name: 'Test Game Config',
        uiSchema: { name: { 'ui:placeholder': 'Enter name' } }
      };

      const mockResult = { 
        _id: '507f1f77bcf86cd799439011',
        schema: body.schema,
        name: body.name,
        uiSchema: body.uiSchema
      };
      jest.spyOn(service, 'upsertGameConfigSchema').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.upsertSchema(body);

      // Assert
      expect(service.upsertGameConfigSchema).toHaveBeenCalledWith({
        id: undefined,
        schema: body.schema,
        name: body.name,
        uiSchema: body.uiSchema
      });
      expect(result).toBe(mockResult);
    });

    it('should call service with correct parameters when updating existing schema', async () => {
      // Arrange
      const id = '507f1f77bcf86cd799439011';
      const body: GameConfigSchemaUpsertRequestDto = {
        schema: { type: 'object', properties: { name: { type: 'string' } } },
        name: 'Updated Game Config',
        uiSchema: { name: { 'ui:placeholder': 'Enter updated name' } }
      };

      const mockResult = { 
        _id: id,
        schema: body.schema,
        name: body.name,
        uiSchema: body.uiSchema
      };
      jest.spyOn(service, 'upsertGameConfigSchema').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.upsertSchema(body, id);

      // Assert
      expect(service.upsertGameConfigSchema).toHaveBeenCalledWith({
        id,
        schema: body.schema,
        name: body.name,
        uiSchema: body.uiSchema
      });
      expect(result).toBe(mockResult);
    });
  });

  describe('getSchema', () => {
    it('should call getGameConfigSchema when id is provided', async () => {
      // Arrange
      const id = '507f1f77bcf86cd799439011';
      const mockResult = {
        _id: id,
        schema: { type: 'object' },
        name: 'Test Schema',
        uiSchema: {}
      };
      jest.spyOn(service, 'getGameConfigSchema').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.getSchema({ id });

      // Assert
      expect(service.getGameConfigSchema).toHaveBeenCalledWith(id);
      expect(result).toBe(mockResult);
    });
  });

  describe('listSchemas', () => {
    it('should call getAllGameConfigSchemas', async () => {
      // Arrange
      const mockResult = [
        { _id: '507f1f77bcf86cd799439011', name: 'Schema 1' },
        { _id: '507f1f77bcf86cd799439012', name: 'Schema 2' }
      ];
      jest.spyOn(service, 'getAllGameConfigSchemas').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.listSchemas();

      // Assert
      expect(service.getAllGameConfigSchemas).toHaveBeenCalled();
      expect(result).toBe(mockResult);
    });
  });
});
