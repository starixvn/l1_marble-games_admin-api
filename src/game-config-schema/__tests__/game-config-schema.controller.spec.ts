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
          },
        },
      ],
    }).compile();

    controller = module.get<GameConfigSchemaController>(GameConfigSchemaController);
    service = module.get<GameConfigSchemaService>(GameConfigSchemaService);
  });

  describe('upsertSchema', () => {
    it('should call service with correct parameters', async () => {
      // Arrange
      const gameId = 123;
      const body: GameConfigSchemaUpsertRequestDto = {
        schema: { someProperty: 'value' }
      } as GameConfigSchemaUpsertRequestDto;

      const mockResult = { gameId, schema: body };
      jest.spyOn(service, 'upsertGameConfigSchema').mockResolvedValue(mockResult as any);

      // Act
      const result = await controller.upsertSchema(gameId, body);

      // Assert
      expect(service.upsertGameConfigSchema).toHaveBeenCalledWith({
        gameId,
        schema: body
      });
      expect(result).toBe(mockResult);
    });
  });
});
