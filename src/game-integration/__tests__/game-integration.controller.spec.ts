import { Test, TestingModule } from '@nestjs/testing';
import { GameIntegrationController } from '../game-integration.controller';
import { GameIntegrationService } from '../game-integration.service';
import { GameIntegrationQueryDto } from '../dto/game-integration-query.dto';
import { GameIntegrationUpdateRequestDto } from '../dto/game-integration-update-request.dto';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';

describe('GameIntegrationController', () => {
  let controller: GameIntegrationController;
  let service: GameIntegrationService;

  const mockGameIntegrationService = {
    upsertGameIntegration: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameIntegrationController],
      providers: [
        {
          provide: GameIntegrationService,
          useValue: mockGameIntegrationService,
        },
      ],
    }).compile();

    controller = module.get<GameIntegrationController>(GameIntegrationController);
    service = module.get<GameIntegrationService>(GameIntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertGameIntegration', () => {
    const mockQueryWithOperatorId: GameIntegrationQueryDto = {
      operatorId: '507f1f77bcf86cd799439011',
      gameId: 1001,
    };

    const mockQueryWithAlias: GameIntegrationQueryDto = {
      alias: 'main-operator',
      gameId: 1001,
    };

    const mockUpdateRequest: GameIntegrationUpdateRequestDto = {
      mergeEvent: { eventType: 'match', priority: 1 },
      mergeEventDetails: [{ detail: 'live', value: true }],
      patches: [{ op: 'replace', path: '/status', value: 'active' }],
      markets: ['1X2', 'Over/Under', 'Both Teams to Score'],
    };

    const mockGameIntegrationResponse = {
      _id: '507f1f77bcf86cd799439012',
      operatorId: '507f1f77bcf86cd799439011',
      gameId: 1001,
      mergeEvent: { eventType: 'match', priority: 1 },
      mergeEventDetails: [{ detail: 'live', value: true }],
      patches: [{ op: 'replace', path: '/status', value: 'active' }],
      markets: ['1X2', 'Over/Under', 'Both Teams to Score'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully upsert game integration with operatorId', async () => {
      // Arrange
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(mockGameIntegrationResponse);

      // Act
      const result = await controller.upsertGameIntegration(mockQueryWithOperatorId, mockUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, mockUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameIntegrationResponse);
    });

    it('should successfully upsert game integration with alias', async () => {
      // Arrange
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(mockGameIntegrationResponse);

      // Act
      const result = await controller.upsertGameIntegration(mockQueryWithAlias, mockUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithAlias, mockUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameIntegrationResponse);
    });

    it('should successfully upsert game integration with minimal update request', async () => {
      // Arrange
      const minimalUpdateRequest: GameIntegrationUpdateRequestDto = {};
      const minimalResponse = {
        ...mockGameIntegrationResponse,
        mergeEvent: undefined,
        mergeEventDetails: undefined,
        patches: undefined,
        markets: undefined,
      };
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(minimalResponse);

      // Act
      const result = await controller.upsertGameIntegration(mockQueryWithOperatorId, minimalUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, minimalUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(minimalResponse);
    });

    it('should throw NotFoundException when operator is not found', async () => {
      // Arrange
      const error = new NotFoundException('Operator not found');
      mockGameIntegrationService.upsertGameIntegration.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.upsertGameIntegration(mockQueryWithOperatorId, mockUpdateRequest)
      ).rejects.toThrow(NotFoundException);

      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, mockUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException when update operation fails', async () => {
      // Arrange
      const error = new InternalServerErrorException('Update failed');
      mockGameIntegrationService.upsertGameIntegration.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.upsertGameIntegration(mockQueryWithOperatorId, mockUpdateRequest)
      ).rejects.toThrow(InternalServerErrorException);

      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, mockUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
    });

    it('should propagate any unexpected error from service', async () => {
      // Arrange
      const error = new Error('Unexpected error');
      mockGameIntegrationService.upsertGameIntegration.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.upsertGameIntegration(mockQueryWithOperatorId, mockUpdateRequest)
      ).rejects.toThrow('Unexpected error');

      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, mockUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
    });

    it('should handle query with only required gameId parameter', async () => {
      // Arrange
      const queryWithOnlyGameId = { gameId: 1001 } as GameIntegrationQueryDto;
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(mockGameIntegrationResponse);

      // Act
      const result = await controller.upsertGameIntegration(queryWithOnlyGameId, mockUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(queryWithOnlyGameId, mockUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameIntegrationResponse);
    });

    it('should handle updateRequest with only mergeEvent', async () => {
      // Arrange
      const partialUpdateRequest: GameIntegrationUpdateRequestDto = {
        mergeEvent: { eventType: 'match', priority: 1 },
      };
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(mockGameIntegrationResponse);

      // Act
      const result = await controller.upsertGameIntegration(mockQueryWithOperatorId, partialUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, partialUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameIntegrationResponse);
    });

    it('should handle updateRequest with only markets', async () => {
      // Arrange
      const partialUpdateRequest: GameIntegrationUpdateRequestDto = {
        markets: ['1X2', 'Over/Under'],
      };
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(mockGameIntegrationResponse);

      // Act
      const result = await controller.upsertGameIntegration(mockQueryWithOperatorId, partialUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, partialUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameIntegrationResponse);
    });

    it('should handle updateRequest with complex patch operations', async () => {
      // Arrange
      const complexUpdateRequest: GameIntegrationUpdateRequestDto = {
        patches: [
          { op: 'replace', path: '/status', value: 'active' },
          { op: 'add', path: '/config/timeout', value: 5000 },
          { op: 'remove', path: '/deprecated' },
        ],
      };
      mockGameIntegrationService.upsertGameIntegration.mockResolvedValue(mockGameIntegrationResponse);

      // Act
      const result = await controller.upsertGameIntegration(mockQueryWithOperatorId, complexUpdateRequest);

      // Assert
      expect(service.upsertGameIntegration).toHaveBeenCalledWith(mockQueryWithOperatorId, complexUpdateRequest);
      expect(service.upsertGameIntegration).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockGameIntegrationResponse);
    });
  });
});
