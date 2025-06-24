import { Test, TestingModule } from '@nestjs/testing';
import { GameConfigController } from '../game-config.controller';
import { GameConfigService } from '../game-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { GameConfigUpdateRequestDto } from '../dto/game-config.dto';

describe('GameConfigController', () => {
  let controller: GameConfigController;
  let mockGameConfigService: jest.Mocked<GameConfigService>;

  const mockSchemaId = '507f1f77bcf86cd799439011';

  beforeEach(async () => {
    mockGameConfigService = {
      upsertGameConfig: jest.fn(),
      getGameConfigByGameId: jest.fn(),
      getAllGameConfigs: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameConfigController],
      providers: [
        {
          provide: GameConfigService,
          useValue: mockGameConfigService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<GameConfigController>(GameConfigController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertGameConfig', () => {
    it('should call service with correct parameters and return service result', async () => {
      const gameId = 1;
      const schemaId = mockSchemaId;
      const body: GameConfigUpdateRequestDto = { enabled: true, maxPlayers: 10 };
      const serviceResult = { gameId, config: { enabled: true, maxPlayers: 10 } };

      mockGameConfigService.upsertGameConfig.mockResolvedValue(serviceResult as any);

      const result = await controller.upsertGameConfig({ schemaId, gameId }, body);

      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith({
        schemaId,
        gameId: Number(gameId),
        config: body
      });
      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledTimes(1);
      expect(result).toEqual(serviceResult);
    });

    it('should call service with different config structure', async () => {
      const gameId = 2;
      const schemaId = mockSchemaId;
      const body: GameConfigUpdateRequestDto = { enabled: false, settings: { difficulty: 'easy', theme: 'dark' } };
      const serviceResult = { gameId, config: { enabled: false, settings: { difficulty: 'easy', theme: 'dark' } } };

      mockGameConfigService.upsertGameConfig.mockResolvedValue(serviceResult as any);

      const result = await controller.upsertGameConfig({ schemaId, gameId }, body);

      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith({
        schemaId,
        gameId: Number(gameId),
        config: body
      });
      expect(result).toEqual(serviceResult);
    });

    it('should handle empty config object', async () => {
      const gameId = 3;
      const schemaId = mockSchemaId;
      const body: GameConfigUpdateRequestDto = {};
      const serviceResult = { gameId, config: {} };

      mockGameConfigService.upsertGameConfig.mockResolvedValue(serviceResult as any);

      const result = await controller.upsertGameConfig({ schemaId, gameId }, body);

      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith({
        schemaId,
        gameId: Number(gameId),
        config: body
      });
      expect(result).toEqual(serviceResult);
    });

    it('should propagate service errors', async () => {
      const gameId = 1;
      const schemaId = mockSchemaId;
      const body: GameConfigUpdateRequestDto = { enabled: true };
      const error = new Error('Service error');

      mockGameConfigService.upsertGameConfig.mockRejectedValue(error);

      await expect(controller.upsertGameConfig({ schemaId, gameId }, body)).rejects.toThrow('Service error');
      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith({
        schemaId,
        gameId: Number(gameId),
        config: body
      });
    });
  });

  describe('getGameConfig', () => {
    it('should call service with correct gameId and return result', async () => {
      const gameId = 123;
      const mockResult = { gameId, config: { enabled: true, maxPlayers: 4 } };

      mockGameConfigService.getGameConfigByGameId.mockResolvedValue(mockResult as any);

      const result = await controller.getGameConfig({ gameId });

      expect(mockGameConfigService.getGameConfigByGameId).toHaveBeenCalledWith(Number(gameId));
      expect(mockGameConfigService.getGameConfigByGameId).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should handle different gameIds', async () => {
      const gameId = 456;
      const mockResult = { gameId, config: { enabled: false } };

      mockGameConfigService.getGameConfigByGameId.mockResolvedValue(mockResult as any);

      const result = await controller.getGameConfig({ gameId });

      expect(mockGameConfigService.getGameConfigByGameId).toHaveBeenCalledWith(Number(gameId));
      expect(result).toEqual(mockResult);
    });

    it('should propagate service errors', async () => {
      const gameId = 123;
      const error = new Error('Game config not found');

      mockGameConfigService.getGameConfigByGameId.mockRejectedValue(error);

      await expect(controller.getGameConfig({ gameId })).rejects.toThrow('Game config not found');
      expect(mockGameConfigService.getGameConfigByGameId).toHaveBeenCalledWith(Number(gameId));
    });
  });

  describe('getAllGameConfigs', () => {
    it('should call service and return all game configs', async () => {
      const mockResult = [
        { gameId: 1, config: { enabled: true } },
        { gameId: 2, config: { enabled: false } },
        { gameId: 3, config: { maxPlayers: 8 } }
      ];

      mockGameConfigService.getAllGameConfigs.mockResolvedValue(mockResult as any);

      const result = await controller.getAllGameConfigs();

      expect(mockGameConfigService.getAllGameConfigs).toHaveBeenCalledWith();
      expect(mockGameConfigService.getAllGameConfigs).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('should handle empty result', async () => {
      const mockResult: any[] = [];

      mockGameConfigService.getAllGameConfigs.mockResolvedValue(mockResult);

      const result = await controller.getAllGameConfigs();

      expect(mockGameConfigService.getAllGameConfigs).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Database connection failed');

      mockGameConfigService.getAllGameConfigs.mockRejectedValue(error);

      await expect(controller.getAllGameConfigs()).rejects.toThrow('Database connection failed');
      expect(mockGameConfigService.getAllGameConfigs).toHaveBeenCalledWith();
    });
  });
});
