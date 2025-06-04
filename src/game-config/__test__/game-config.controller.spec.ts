import { Test, TestingModule } from '@nestjs/testing';
import { GameConfigController } from '../game-config.controller';
import { GameConfigService } from '../game-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt.auth.guard';
import { GameConfigUpdateRequestDto } from '../dto/game-config.dto';

describe('GameConfigController', () => {
  let controller: GameConfigController;
  let mockGameConfigService: jest.Mocked<GameConfigService>;

  beforeEach(async () => {
    mockGameConfigService = {
      upsertGameConfig: jest.fn(),
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
      const body: GameConfigUpdateRequestDto = { enabled: true, maxPlayers: 10 };
      const serviceResult = { gameId, config: { enabled: true, maxPlayers: 10 } };

      mockGameConfigService.upsertGameConfig.mockResolvedValue(serviceResult as any);

      const result = await controller.upsertGameConfig(gameId, body);

      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith(gameId, body);
      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledTimes(1);
      expect(result).toEqual(serviceResult);
    });

    it('should call service with different config structure', async () => {
      const gameId = 2;
      const body: GameConfigUpdateRequestDto = { enabled: false, settings: { difficulty: 'easy', theme: 'dark' } };
      const serviceResult = { gameId, config: { enabled: false, settings: { difficulty: 'easy', theme: 'dark' } } };

      mockGameConfigService.upsertGameConfig.mockResolvedValue(serviceResult as any);

      const result = await controller.upsertGameConfig(gameId, body);

      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith(gameId, body);
      expect(result).toEqual(serviceResult);
    });

    it('should handle empty config object', async () => {
      const gameId = 3;
      const body: GameConfigUpdateRequestDto = {};
      const serviceResult = { gameId, config: {} };

      mockGameConfigService.upsertGameConfig.mockResolvedValue(serviceResult as any);

      const result = await controller.upsertGameConfig(gameId, body);

      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith(gameId, body);
      expect(result).toEqual(serviceResult);
    });

    it('should propagate service errors', async () => {
      const gameId = 1;
      const body: GameConfigUpdateRequestDto = { enabled: true };
      const error = new Error('Service error');

      mockGameConfigService.upsertGameConfig.mockRejectedValue(error);

      await expect(controller.upsertGameConfig(gameId, body)).rejects.toThrow('Service error');
      expect(mockGameConfigService.upsertGameConfig).toHaveBeenCalledWith(gameId, body);
    });
  });
});
