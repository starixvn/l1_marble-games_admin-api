import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
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
      findOne: jest.fn(),
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
    mockMarketIntegrationModel = module.get(
      getModelToken(MarketIntegration.name),
    );
    mockOperatorModel = module.get(getModelToken(OperatorCredential.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setupOperatorMock = (operator: any) => {
    mockOperatorModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(operator),
      }),
    });
  };

  const setupGameIntegrationFindOneMock = (gameIntegration: any) => {
    mockGameIntegrationModel.findOne.mockReturnValue({
      select: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(gameIntegration),
        }),
      }),
    });
  };

  const setupGameIntegrationFindOneAndUpdateMock = (result: any) => {
    mockGameIntegrationModel.findOneAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue(result),
    });
  };

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

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneAndUpdateMock(mockUpsertedIntegration);
        setupGameIntegrationFindOneMock(mockUpsertedIntegration);

        // Act
        const result = await service.upsertGameIntegration(
          query,
          updateRequest,
        );

        // Assert
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          _id: mockOperatorId.toString(),
        });
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          {
            $set: {
              ...updateRequest,
              operatorId: mockOperatorId,
              gameId: 1001,
              markets: [],
            },
          },
          { upsert: true, new: true },
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
          markets: [mockCreatedMarketIntegration],
        };

        setupOperatorMock(mockOperator);
        mockMarketIntegrationModel.findOneAndUpdate.mockResolvedValue(
          mockCreatedMarketIntegration,
        );
        setupGameIntegrationFindOneAndUpdateMock(mockUpsertedIntegration);
        setupGameIntegrationFindOneMock(mockUpsertedIntegration);

        // Act
        const result = await service.upsertGameIntegration(
          query,
          updateRequest,
        );

        // Assert
        expect(mockMarketIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { name: 'Test Market' },
          { 
            $set: {
              merge: { key: 'value' },
              selections: ['Selection 1', 'Selection 2'],
            },
          },
          { new: true, upsert: true },
        );
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          {
            $set: {
              mergeEvent: { eventType: 'match' },
              operatorId: mockOperatorId,
              gameId: 1001,
              markets: [mockMarketIntegrationId],
            },
          },
          { upsert: true, new: true },
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });

      it('should update existing market integration when name is provided', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
          markets: [
            {
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
          markets: [mockUpdatedMarketIntegration],
        };

        setupOperatorMock(mockOperator);
        mockMarketIntegrationModel.findOneAndUpdate.mockResolvedValue(
          mockUpdatedMarketIntegration,
        );
        setupGameIntegrationFindOneAndUpdateMock(mockUpsertedIntegration);
        setupGameIntegrationFindOneMock(mockUpsertedIntegration);

        // Act
        const result = await service.upsertGameIntegration(
          query,
          updateRequest,
        );

        // Assert
        expect(
          mockMarketIntegrationModel.findOneAndUpdate,
        ).toHaveBeenCalledWith(
          { name: 'Updated Market' },
          { 
            $set: {
              merge: { updated: true },
              selections: ['Updated Selection'],
            },
          },
          { new: true, upsert: true },
        );
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          {
            $set: {
              mergeEvent: { eventType: 'match' },
              operatorId: mockOperatorId,
              gameId: 1001,
              markets: [mockMarketIntegrationId],
            },
          },
          { upsert: true, new: true },
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });
    });

    describe('when name is provided', () => {
      it('should upsert game integration successfully', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          name: 'test-operator',
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

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneAndUpdateMock(mockUpsertedIntegration);
        setupGameIntegrationFindOneMock(mockUpsertedIntegration);

        // Act
        const result = await service.upsertGameIntegration(
          query,
          updateRequest,
        );

        // Assert
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          name: 'test-operator',
        });
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          {
            $set: {
              ...updateRequest,
              operatorId: mockOperatorId,
              gameId: 1001,
              markets: [],
            },
          },
          { upsert: true, new: true },
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });

      describe('and operator does not exist', () => {
        it('should throw NotFoundException', async () => {
          // Arrange
          const query: GameIntegrationQueryDto = {
            name: 'non-existent-operator',
            gameId: 1001,
          };
          const updateRequest: GameIntegrationUpdateRequestDto = {
            mergeEvent: { eventType: 'match' },
          };

          setupOperatorMock(null);

          // Act & Assert
          await expect(
            service.upsertGameIntegration(query, updateRequest),
          ).rejects.toThrow(NotFoundException);
          expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
            name: 'non-existent-operator',
          });
        });
      });
    });

    describe('when neither operatorId nor name is provided', () => {
      it('should throw NotFoundException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
        };

        // Act & Assert
        await expect(
          service.upsertGameIntegration(query, updateRequest),
        ).rejects.toThrow(NotFoundException);
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

        setupOperatorMock(null);

        // Act & Assert
        await expect(
          service.upsertGameIntegration(query, updateRequest),
        ).rejects.toThrow(NotFoundException);
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          _id: mockOperatorId.toString(),
        });
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

        setupOperatorMock(mockOperator);
        mockMarketIntegrationModel.findOneAndUpdate.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.upsertGameIntegration(query, updateRequest),
        ).rejects.toThrow(InternalServerErrorException);
        expect(mockMarketIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { name: 'Test Market' },
          { 
            $set: {
              merge: { key: 'value' },
              selections: ['Selection 1'],
            },
          },
          { new: true, upsert: true },
        );
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
              name: 'Updated Market',
              selections: ['Updated Selection'],
              merge: { updated: true },
            },
          ],
        };
        const mockOperator = { _id: mockOperatorId };

        setupOperatorMock(mockOperator);
        mockMarketIntegrationModel.findOneAndUpdate.mockResolvedValue(null);

        // Act & Assert
        await expect(
          service.upsertGameIntegration(query, updateRequest),
        ).rejects.toThrow(InternalServerErrorException);
        expect(
          mockMarketIntegrationModel.findOneAndUpdate,
        ).toHaveBeenCalledWith(
          { name: 'Updated Market' },
          { 
            $set: {
              merge: { updated: true },
              selections: ['Updated Selection'],
            },
          },
          { new: true, upsert: true },
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

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneAndUpdateMock(mockUpsertedIntegration);
        setupGameIntegrationFindOneMock(mockUpsertedIntegration);

        // Act
        const result = await service.upsertGameIntegration(
          query,
          updateRequest,
        );

        // Assert
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          {
            $set: {
              ...updateRequest,
              operatorId: mockOperatorId,
              gameId: 1001,
              markets: [],
            },
          },
          { upsert: true, new: true },
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

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneAndUpdateMock(mockUpsertedIntegration);
        setupGameIntegrationFindOneMock(mockUpsertedIntegration);

        // Act
        const result = await service.upsertGameIntegration(
          query,
          updateRequest,
        );

        // Assert
        expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
          { operatorId: mockOperatorId, gameId: 1001 },
          { $set: { operatorId: mockOperatorId, gameId: 1001, markets: [] } },
          { upsert: true, new: true },
        );
        expect(result).toEqual(mockUpsertedIntegration);
      });
    });
  });

  describe('getGameIntegration', () => {
    describe('when operatorId is provided', () => {
      it('should return game integration successfully', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const mockOperator = { _id: mockOperatorId };
        const mockMarketIntegration = {
          _id: mockMarketIntegrationId,
          name: 'Test Market',
          selections: ['Selection 1', 'Selection 2'],
          merge: { key: 'value' },
        };
        const mockGameIntegration = {
          operatorId: mockOperatorId,
          gameId: 1001,
          mergeEvent: { eventType: 'match' },
          markets: [mockMarketIntegration],
        };

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneMock(mockGameIntegration);

        // Act
        const result = await service.getGameIntegration(query);

        // Assert
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          _id: mockOperatorId.toString(),
        });
        expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
          operatorId: mockOperatorId,
          gameId: 1001,
        });
        expect(result).toEqual(mockGameIntegration);
      });

      it('should throw NotFoundException when operator does not exist', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };

        setupOperatorMock(null);

        // Act & Assert
        await expect(service.getGameIntegration(query)).rejects.toThrow(
          NotFoundException,
        );
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          _id: mockOperatorId.toString(),
        });
      });
    });

    describe('when name is provided', () => {
      it('should return game integration successfully', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          name: 'test-operator',
          gameId: 1001,
        };
        const mockOperator = { _id: mockOperatorId };
        const mockGameIntegration = {
          operatorId: mockOperatorId,
          gameId: 1001,
          mergeEvent: { eventType: 'match' },
          markets: [],
        };

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneMock(mockGameIntegration);

        // Act
        const result = await service.getGameIntegration(query);

        // Assert
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          name: 'test-operator',
        });
        expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
          operatorId: mockOperatorId,
          gameId: 1001,
        });
        expect(result).toEqual(mockGameIntegration);
      });

      it('should throw NotFoundException when operator does not exist', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          name: 'non-existent-operator',
          gameId: 1001,
        };

        setupOperatorMock(null);

        // Act & Assert
        await expect(service.getGameIntegration(query)).rejects.toThrow(
          NotFoundException,
        );
        expect(mockOperatorModel.findOne).toHaveBeenCalledWith({
          name: 'non-existent-operator',
        });
      });
    });

    describe('when neither operatorId nor name is provided', () => {
      it('should throw NotFoundException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          gameId: 1001,
        };

        // Act & Assert
        await expect(service.getGameIntegration(query)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('when game integration does not exist', () => {
      it('should throw NotFoundException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const mockOperator = { _id: mockOperatorId };

        setupOperatorMock(mockOperator);
        setupGameIntegrationFindOneMock(null);

        // Act & Assert
        await expect(service.getGameIntegration(query)).rejects.toThrow(
          NotFoundException,
        );
        expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
          operatorId: mockOperatorId,
          gameId: 1001,
        });
      });
    });

    describe('market population and transformation', () => {
      it('should populate markets with correct select and transform options', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const mockOperator = { _id: mockOperatorId };
        const mockGameIntegration = {
          operatorId: mockOperatorId,
          gameId: 1001,
          markets: [],
        };

        setupOperatorMock(mockOperator);

        const mockPopulate = jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockGameIntegration),
        });
        const mockSelect = jest.fn().mockReturnValue({
          populate: mockPopulate,
        });
        mockGameIntegrationModel.findOne.mockReturnValue({
          select: mockSelect,
        });

        // Act
        await service.getGameIntegration(query);

        // Assert
        expect(mockSelect).toHaveBeenCalledWith(
          '-_id -__v -gameId -operatorId',
        );
        expect(mockPopulate).toHaveBeenCalledWith({
          path: 'markets',
          select: '-_id -__v',
          transform: expect.any(Function),
        });
      });

      it('should transform market documents correctly', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const mockOperator = { _id: mockOperatorId };
        const mockGameIntegration = {
          operatorId: mockOperatorId,
          gameId: 1001,
          markets: [],
        };

        setupOperatorMock(mockOperator);

        let transformFunction: any;
        const mockPopulate = jest.fn().mockImplementation((options) => {
          transformFunction = options.transform;
          return {
            lean: jest.fn().mockResolvedValue(mockGameIntegration),
          };
        });

        mockGameIntegrationModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            populate: mockPopulate,
          }),
        });

        // Act
        await service.getGameIntegration(query);
        const mockDoc = {
          name: 'Test Market',
          selections: ['Selection 1'],
        };
        const transformedDoc = transformFunction(mockDoc);

        // Assert
        expect(transformedDoc).toEqual({
          name: 'Test Market',
          selections: ['Selection 1'],
        });
      });
    });
  });
});
