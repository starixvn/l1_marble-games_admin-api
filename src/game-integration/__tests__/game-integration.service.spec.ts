import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { GameIntegrationService } from '../game-integration.service';
import { GameIntegration } from '../schema/game-integration.schema';
import { OperatorCredential } from '../../operator/schema/operator-credential.schema';
import { GameIntegrationQueryDto } from '../dto/game-integration-query.dto';
import { GameIntegrationUpdateRequestDto } from '../dto/game-integration-update-request.dto';

describe('GameIntegrationService', () => {
  let service: GameIntegrationService;
  let mockGameIntegrationModel: any;
  let mockOperatorModel: any;

  const mockOperatorId = new Types.ObjectId();
  const mockGameIntegrationId = new Types.ObjectId();

  beforeEach(async () => {
    const mockGameIntegrationModelFactory = {
      findOne: jest.fn(),
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
          provide: getModelToken(OperatorCredential.name),
          useValue: mockOperatorModelFactory,
        },
      ],
    }).compile();

    service = module.get<GameIntegrationService>(GameIntegrationService);
    mockGameIntegrationModel = module.get(getModelToken(GameIntegration.name));
    mockOperatorModel = module.get(getModelToken(OperatorCredential.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertGameIntegration', () => {
    describe('when operatorId is provided', () => {
      describe('and game integration does not exist', () => {
        it('should create new game integration', async () => {
          // Arrange
          const query: GameIntegrationQueryDto = {
            operatorId: mockOperatorId.toString(),
            gameId: 1001,
          };
          const updateRequest: GameIntegrationUpdateRequestDto = {
            mergeEvent: { eventType: 'match' },
            markets: ['1X2'],
          };
          const mockOperator = { _id: mockOperatorId };
          const mockCreatedIntegration = {
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
            ...updateRequest,
            toObject: jest.fn().mockReturnValue({
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
            }),
          };

          mockOperatorModel.findOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOperator),
            }),
          });
          mockGameIntegrationModel.findOne.mockResolvedValue(null);
          mockGameIntegrationModel.create.mockResolvedValue(mockCreatedIntegration);

          // Act
          const result = await service.upsertGameIntegration(query, updateRequest);

          // Assert
          expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ _id: mockOperatorId.toString() });
          expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
            operatorId: mockOperatorId,
            gameId: 1001,
          });
          expect(mockGameIntegrationModel.create).toHaveBeenCalledWith({
            operatorId: mockOperatorId,
            gameId: 1001,
            ...updateRequest,
          });
          expect(mockCreatedIntegration.toObject).toHaveBeenCalled();
          expect(result).toEqual({
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
            ...updateRequest,
          });
        });
      });

      describe('and game integration exists', () => {
        it('should update existing game integration', async () => {
          // Arrange
          const query: GameIntegrationQueryDto = {
            operatorId: mockOperatorId.toString(),
            gameId: 1001,
          };
          const updateRequest: GameIntegrationUpdateRequestDto = {
            mergeEvent: { eventType: 'match' },
            markets: ['1X2'],
          };
          const mockOperator = { _id: mockOperatorId };
          const mockExistingIntegration = {
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
          };
          const mockUpdatedIntegration = {
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
            ...updateRequest,
            toObject: jest.fn().mockReturnValue({
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
            }),
          };

          mockOperatorModel.findOne.mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockOperator),
            }),
          });
          mockGameIntegrationModel.findOne.mockResolvedValue(mockExistingIntegration);
          mockGameIntegrationModel.findOneAndUpdate.mockResolvedValue(mockUpdatedIntegration);

          // Act
          const result = await service.upsertGameIntegration(query, updateRequest);

          // Assert
          expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ _id: mockOperatorId.toString() });
          expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
            operatorId: mockOperatorId,
            gameId: 1001,
          });
          expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: mockGameIntegrationId },
            { $set: updateRequest },
            { new: true }
          );
          expect(mockUpdatedIntegration.toObject).toHaveBeenCalled();
          expect(result).toEqual({
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
            ...updateRequest,
          });
        });
      });
    });

    describe('when alias is provided', () => {
      describe('and operator exists', () => {
        describe('and game integration does not exist', () => {
          it('should create new game integration', async () => {
            // Arrange
            const query: GameIntegrationQueryDto = {
              alias: 'test-operator',
              gameId: 1001,
            };
            const updateRequest: GameIntegrationUpdateRequestDto = {
              mergeEvent: { eventType: 'match' },
              markets: ['1X2'],
            };
            const mockOperator = { _id: mockOperatorId };
            const mockCreatedIntegration = {
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
              toObject: jest.fn().mockReturnValue({
                _id: mockGameIntegrationId,
                operatorId: mockOperatorId,
                gameId: 1001,
                ...updateRequest,
              }),
            };

            mockOperatorModel.findOne.mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockOperator),
              }),
            });
            mockGameIntegrationModel.findOne.mockResolvedValue(null);
            mockGameIntegrationModel.create.mockResolvedValue(mockCreatedIntegration);

            // Act
            const result = await service.upsertGameIntegration(query, updateRequest);

            // Assert
            expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ alias: 'test-operator' });
            expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
              operatorId: mockOperatorId,
              gameId: 1001,
            });
            expect(mockGameIntegrationModel.create).toHaveBeenCalledWith({
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
            });
            expect(result).toEqual({
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
            });
          });
        });

        describe('and game integration exists', () => {
          it('should update existing game integration', async () => {
            // Arrange
            const query: GameIntegrationQueryDto = {
              alias: 'test-operator',
              gameId: 1001,
            };
            const updateRequest: GameIntegrationUpdateRequestDto = {
              mergeEvent: { eventType: 'match' },
              markets: ['1X2'],
            };
            const mockOperator = { _id: mockOperatorId };
            const mockExistingIntegration = {
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
            };
            const mockUpdatedIntegration = {
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
              toObject: jest.fn().mockReturnValue({
                _id: mockGameIntegrationId,
                operatorId: mockOperatorId,
                gameId: 1001,
                ...updateRequest,
              }),
            };

            mockOperatorModel.findOne.mockReturnValue({
              select: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockOperator),
              }),
            });
            mockGameIntegrationModel.findOne.mockResolvedValue(mockExistingIntegration);
            mockGameIntegrationModel.findOneAndUpdate.mockResolvedValue(mockUpdatedIntegration);

            // Act
            const result = await service.upsertGameIntegration(query, updateRequest);

            // Assert
            expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ alias: 'test-operator' });
            expect(mockGameIntegrationModel.findOne).toHaveBeenCalledWith({
              operatorId: mockOperatorId,
              gameId: 1001,
            });
            expect(mockGameIntegrationModel.findOneAndUpdate).toHaveBeenCalledWith(
              { _id: mockGameIntegrationId },
              { $set: updateRequest },
              { new: true }
            );
            expect(result).toEqual({
              _id: mockGameIntegrationId,
              operatorId: mockOperatorId,
              gameId: 1001,
              ...updateRequest,
            });
          });
        });
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

    describe('when create operation fails', () => {
      it('should throw InternalServerErrorException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
        };
        const mockOperator = { _id: mockOperatorId };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOne.mockResolvedValue(null);
        mockGameIntegrationModel.create.mockResolvedValue(null);

        // Act & Assert
        await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
          InternalServerErrorException
        );
      });
    });

    describe('when update operation fails', () => {
      it('should throw InternalServerErrorException', async () => {
        // Arrange
        const query: GameIntegrationQueryDto = {
          operatorId: mockOperatorId.toString(),
          gameId: 1001,
        };
        const updateRequest: GameIntegrationUpdateRequestDto = {
          mergeEvent: { eventType: 'match' },
        };
        const mockOperator = { _id: mockOperatorId };
        const mockExistingIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOne.mockResolvedValue(mockExistingIntegration);
        mockGameIntegrationModel.findOneAndUpdate.mockResolvedValue(null);

        // Act & Assert
        await expect(service.upsertGameIntegration(query, updateRequest)).rejects.toThrow(
          InternalServerErrorException
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
          markets: ['1X2', 'Over/Under', 'Both Teams to Score'],
        };
        const mockOperator = { _id: mockOperatorId };
        const mockCreatedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          ...updateRequest,
          toObject: jest.fn().mockReturnValue({
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
            ...updateRequest,
          }),
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOne.mockResolvedValue(null);
        mockGameIntegrationModel.create.mockResolvedValue(mockCreatedIntegration);

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockGameIntegrationModel.create).toHaveBeenCalledWith({
          operatorId: mockOperatorId,
          gameId: 1001,
          ...updateRequest,
        });
        expect(result).toEqual({
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          ...updateRequest,
        });
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
        const mockCreatedIntegration = {
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
          toObject: jest.fn().mockReturnValue({
            _id: mockGameIntegrationId,
            operatorId: mockOperatorId,
            gameId: 1001,
          }),
        };

        mockOperatorModel.findOne.mockReturnValue({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockOperator),
          }),
        });
        mockGameIntegrationModel.findOne.mockResolvedValue(null);
        mockGameIntegrationModel.create.mockResolvedValue(mockCreatedIntegration);

        // Act
        const result = await service.upsertGameIntegration(query, updateRequest);

        // Assert
        expect(mockGameIntegrationModel.create).toHaveBeenCalledWith({
          operatorId: mockOperatorId,
          gameId: 1001,
        });
        expect(result).toEqual({
          _id: mockGameIntegrationId,
          operatorId: mockOperatorId,
          gameId: 1001,
        });
      });
    });
  });
});
