import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { GameIntegrationService } from '../game-integration.service';
import { GameIntegration } from '../schema/game-integration.schema';
import { MarketIntegration } from '../schema/market-integration.schema';
import { OperatorCredential } from '../../operator/schema/operator-credential.schema';
import { GameIntegrationQueryDto } from '../dto/game-integration-query.dto';
import { GameIntegrationUpdateRequestDto } from '../dto/game-integration-update-request.dto';

describe('GameIntegrationService', () => {
  let service: GameIntegrationService;
  let mockGameIntegrationModel: any;
  let mockMarketIntegrationModel: any;
  let mockOperatorModel: any;

  const mockOperatorId = new Types.ObjectId();
  const mockGameIntegrationId = new Types.ObjectId();
  const mockMarketIntegrationId = new Types.ObjectId();

  beforeEach(async () => {
    const mockGameIntegrationModelFactory = {
      findOneAndUpdate: jest.fn(),
    };

    const mockMarketIntegrationModelFactory = {
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const mockOperatorModelFactory = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameIntegrationService,
        {
          provide: getModelToken(GameIntegration.name),
          useValue: mockGameIntegrationModelFactory,
        },
        {
          provide: getModelToken(MarketIntegration.name),
          useValue: mockMarketIntegrationModelFactory,
        },
        {
          provide: getModelToken(OperatorCredential.name),
          useValue: mockOperatorModelFactory,
        },
      ],
    }).compile();

    service = module.get<GameIntegrationService>(GameIntegrationService);
    mockGameIntegrationModel = module.get(getModelToken(GameIntegration.name));
    mockMarketIntegrationModel = module.get(getModelToken(MarketIntegration.name));
    mockOperatorModel = module.get(getModelToken(OperatorCredential.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertGameIntegration', () => {
    describe('when operatorId is provided', () => {
      it('should upsert game integration successfully', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [],
        };
        const mockOperator = { _id: mockOperatorId };
        const mockUpsertedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          ...updateRequest,
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpsertedIntegration),
        });

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ _id: mockOperatorId.toString() });
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { ...updateRequest, markets: [] } },
          { upsert: true, new: true }
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });

      it('should upsert game integration with market integrations', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [
            {
              name: 'Test Market',
              selections: ['Selection 1', 'Selection 2'],
              merge: { key: 'value' },
            },
          ],
        };
        const mockOperator = { _id: mockOperatorId };
        const mockCreatedMarketIntegration = {
          _id: mockMarketIntegrationId,
          name: 'Test Market',
          selections: ['Selection 1', 'Selection 2'],
          merge: { key: 'value' },
        };
        const mockUpsertedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          mergeEvent: { eventType: 'match' },
          markets: [mockMarketIntegrationId],
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockMarketIntegrationModel.create.mockResolvedValue(mockCreatedMarketIntegration);
        mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpsertedIntegration),
        });

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockMarketIntegrationModel.create).toHaveBeenCalledWith({
          selections: ['Selection 1', 'Selection 2'],
          merge: { key: 'value' },
          name: 'Test Market',
        });
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { mergeEvent: { eventType: 'match' }, markets: [mockMarketIntegrationId] } },
          { upsert: true, new: true }
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });

      it('should update existing market integration when id is provided', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [
            {
              id: mockMarketIntegrationId.toString(),
              name: 'Updated Market',
              selections: ['Updated Selection'],
              merge: { updated: true },
            },
          ],
        };
        const mockOperator = { _id: mockOperatorId };
        const mockUpdatedMarketIntegration = {
          _id: mockMarketIntegrationId,
          name: 'Updated Market',
          selections: ['Updated Selection'],
          merge: { updated: true },
        };
        const mockUpsertedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          mergeEvent: { eventType: 'match' },
          markets: [mockMarketIntegrationId],
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockMarketIntegrationModel.findOneAndUpdate.mockResolvedValue(mockUpdatedMarketIntegration);
        mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpsertedIntegration),
        });

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockMarketIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: mockMarketIntegrationId.toString() },
          { $set: updateRequest.markets![0] },
          { new: true, upsert: true }
        );
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { mergeEvent: { eventType: 'match' }, markets: [mockMarketIntegrationId] } },
          { upsert: true, new: true }
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });
    });

    describe('when alias is provided', () => {
      it('should upsert game integration successfully', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          alias: 'test-operator',
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [],
        };
        const mockOperator = { _id: mockOperatorId };
        const mockUpsertedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          ...updateRequest,
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpsertedIntegration),
        });

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ alias: 'test-operator' });
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { ...updateRequest, markets: [] } },
          { upsert: true, new: true }
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });

      describe('and operator does not exist', () => {
        it('should throw NotFoundException', async () => {
          // Arrange
          const query: GameIntegrationQueryDto = {
            alias: 'non-existent-operator',
            gameId: 1001,
          };
          const updateRequest: GameIntegrationUpdateRequestDto = {
            mergeEvent: { eventType: 'match' },
          };

          mockOperatorModel.findOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(null),
            }),
          });

          // Act & Assert
          await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
            NotFoundException
          );
          expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ alias: 'non-existent-operator' });
        });
      });
    });

    describe('when neither operatorId nor alias is provided', () => {
      it('should throw NotFoundException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
        };

        // Act & Assert
        await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
          NotFoundException
        );
      });
    });

    describe('when operatorId is provided but operator does not exist', () => {
      it('should throw NotFoundException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null),
          }),
        });

        // Act & Assert
        await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
          NotFoundException
        );
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ _id: mockOperatorId.toString() });
      });
    });

    describe('when market integration creation fails', () => {
      it('should throw InternalServerErrorException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [
            {
              name: 'Test Market',
              selections: ['Selection 1'],
              merge: { key: 'value' },
            },
          ],
        };
        const mockOperator = { _id: mockOperatorId };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockMarketIntegrationModel.create.mockResolvedValue(null);

        // Act & Assert
        await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
          InternalServerErrorException
        );
        expect(mockMarketIntegrationModel.create).toHaveBeenCalledWith({
          selections: ['Selection 1'],
          merge: { key: 'value' },
          name: 'Test Market',
        });
      });
    });

    describe('when market integration update fails', () => {
      it('should throw InternalServerErrorException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [
            {
              id: mockMarketIntegrationId.toString(),
              name: 'Updated Market',
            },
          ],
        };
        const mockOperator = { _id: mockOperatorId };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockMarketIntegrationModel.findOneAndUpdate.mockResolvedValue(null);

        // Act & Assert
        await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
          InternalServerErrorException
        );
        expect(mockMarketIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { _id: mockMarketIntegrationId.toString() },
          { $set: updateRequest.markets![0] },
          { new: true, upsert: true }
        );
      });
    });

    describe('with complete update request data', () => {
      it('should handle all optional fields', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match', priority: 1 },
          mergeEventDetails: [{ detail: 'live', value: true }],
          patches: [{ op: 'replace', path: '/status', value: 'active' }],
          markets: [],
        };
        const mockOperator = { _id: mockOperatorId };
        const mockUpsertedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          ...updateRequest,
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpsertedIntegration),
        });

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { ...updateRequest, markets: [] } },
          { upsert: true, new: true }
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });
    });

    describe('with empty update request', () => {
      it('should handle empty update request', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {};
        const mockOperator = { _id: mockOperatorId };
        const mockUpsertedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          markets: [],
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
          select: jest.fn().mockResolvedValue(mockUpsertedIntegration),
        });

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { markets: [] } },
          { upsert: true, new: true }
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });
    });
  });
});
