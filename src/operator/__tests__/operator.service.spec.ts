import { Test, TestingModule } from '@nestjs/testing';
import { OperatorService } from '../operator.service';
import { getModelToken } from '@nestjs/mongoose';
import { OperatorCredential } from '../schema/operator-credential.schema';
import * as bcrypt from 'bcryptjs';
import * as randomUtils from '../../utils/random';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

describe('OperatorService', () => {
  let service: OperatorService;
  let mockOperatorModel: any;
  let bcryptHashSpy: jest.SpyInstance;
  let generateRandomPasswordSpy: jest.SpyInstance;

  beforeEach(async () => {
    bcryptHashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);
    generateRandomPasswordSpy = jest.spyOn(randomUtils, 'generateRandomPassword').mockReturnValue('random-password');

    class MockOperatorModel {
      password: string;
      name?: string;
      _id: any = 'test-id';
      save = jest.fn().mockReturnValue(this);

      constructor(dto: any) {
        this.password = dto.password;
        this.name = dto.name;
      }

      static readonly findById = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => Promise.resolve(null)),
      }));
      
      static readonly findOne = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockImplementation(() => Promise.resolve(null)),
      }));
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OperatorService,
        {
          provide: getModelToken(OperatorCredential.name),
          useValue: MockOperatorModel,
        },
      ],
    }).compile();

    service = module.get<OperatorService>(OperatorService);
    mockOperatorModel = module.get(getModelToken(OperatorCredential.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOperator', () => {
    it('should create an operator and return id with password', async () => {
      // Arrange
      const mockSavedOperator = {
        _id: 'test-id',
        toString: () => 'test-id',
      };
      
      // Use a class-based approach without `this` typing issues
      mockOperatorModel.prototype.save = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          _id: mockSavedOperator,
          password: 'hashed-password',
          name: 'new-operator'
        });
      });

      // Act
      const result = await service.createOperator({ name: 'new-operator' });

      // Assert
      expect(generateRandomPasswordSpy).toHaveBeenCalled();
      expect(bcryptHashSpy).toHaveBeenCalledWith('random-password', 10);
      expect(result).toEqual({
        operatorId: 'test-id',
        password: 'random-password',
      });
    });
  });

  describe('updateName', () => {
    it('should update operator name', async () => {
      // Arrange
      const foundOperator = {
        _id: 'operator-id-123',
        password: 'hashed-password',
        name: 'old-name',
        save: jest.fn().mockResolvedValue(true),
      };
      mockOperatorModel.findById.mockReturnValue(foundOperator);
      mockOperatorModel.findOne.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      // Act
      await service.updateName({ operatorId: 'operator-id-123', name: 'new-name' });

      // Assert
      expect(mockOperatorModel.findById).toHaveBeenCalledWith('operator-id-123');
      expect(foundOperator.save).toHaveBeenCalled();
      expect(foundOperator.name).toBe('new-name');
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockOperatorModel.findById.mockReturnValue(null);
      mockOperatorModel.findOne.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(null),
      }));

      // Act & Assert
      await expect(
        service.updateName({ operatorId: 'non-existent-id', name: 'new-name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if operator with same name already exists', async () => {
      // Arrange
      const existingOperator = {
        _id: 'existing-operator-id',
        name: 'duplicate-name',
      };
      const operatorToUpdate = {
        _id: 'operator-id-123',
        password: 'hashed-password',
        name: 'old-name',
        save: jest.fn().mockResolvedValue(true),
      };
      
      mockOperatorModel.findById.mockReturnValue(operatorToUpdate);
      mockOperatorModel.findOne.mockImplementation(() => ({
        select: jest.fn().mockResolvedValue(existingOperator),
      }));

      // Act
      const promise = service.updateName({ operatorId: 'operator-id-123', name: 'duplicate-name' });

      // Assert
      await expect(promise).rejects.toThrow(ConflictException);
      expect(operatorToUpdate.save).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password when operatorId is provided', async () => {
      // Arrange
      const foundOperator = {
        _id: {
          toString: () => 'operator-id-123'
        },
        password: 'old-hashed-password',
        name: 'test-operator',
        save: jest.fn().mockResolvedValue(true),
      };
      mockOperatorModel.findById.mockReturnValue(foundOperator);
      mockOperatorModel.findOne.mockReturnValue(null);

      // Act
      const result = await service.changePassword({ operatorId: 'operator-id-123' });

      // Assert
      expect(mockOperatorModel.findById).toHaveBeenCalledWith('operator-id-123');
      expect(generateRandomPasswordSpy).toHaveBeenCalled();
      expect(bcryptHashSpy).toHaveBeenCalledWith('random-password', 10);
      expect(foundOperator.save).toHaveBeenCalled();
      expect(result).toEqual({
        operatorId: 'operator-id-123',
        password: 'random-password',
      });
    });

    it('should change password when name is provided', async () => {
      // Arrange
      const foundOperator = {
        _id: {
          toString: () => 'operator-id-123'
        },
        password: 'old-hashed-password',
        name: 'test-operator',
        save: jest.fn().mockResolvedValue(true),
      };
      mockOperatorModel.findById.mockReturnValue(null);
      mockOperatorModel.findOne.mockReturnValue(foundOperator);

      // Act
      const result = await service.changePassword({ name: 'test-operator' });

      // Assert
      expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ name: 'test-operator' });
      expect(generateRandomPasswordSpy).toHaveBeenCalled();
      expect(bcryptHashSpy).toHaveBeenCalledWith('random-password', 10);
      expect(foundOperator.save).toHaveBeenCalled();
      expect(result).toEqual({
        operatorId: 'operator-id-123',
        password: 'random-password',
      });
    });

    it('should throw BadRequestException if neither operatorId nor name provided', async () => {
      // Arrange & Act & Assert
      await expect(service.changePassword({})).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockOperatorModel.findById.mockReturnValue(null);
      mockOperatorModel.findOne.mockReturnValue(null);

      // Act & Assert
      await expect(
        service.changePassword({ operatorId: 'non-existent-id' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllOperators', () => {
    it('should return all operators with transformed fields', async () => {
      // Arrange
      const mockAggregateResult = [
        { id: 'operator-1', name: 'operator-one' },
        { id: 'operator-2', name: 'operator-two' },
        { id: 'operator-3', name: null },
      ];
      
      mockOperatorModel.aggregate = jest.fn().mockResolvedValue(mockAggregateResult);

      // Act
      const result = await service.getAllOperators();

      // Assert
      expect(mockOperatorModel.aggregate).toHaveBeenCalledWith([
        {
          $project: {
            "id": "$_id",
            "_id": 0,
            "name": 1,
          }
        }
      ]);
      expect(result).toEqual(mockAggregateResult);
    });
  });

  describe('getOperator', () => {
    beforeEach(() => {
      // Reset mocks for getOperator tests
      mockOperatorModel.findById.mockClear();
      mockOperatorModel.findOne.mockClear();
    });

    it('should get operator by operatorId successfully', async () => {
      // Arrange
      const mockOperator = {
        _id: 'operator-id-123',
        name: 'test-operator',
        password: 'hashed-password',
        __v: 0,
        toObject: () => ({
          _id: 'operator-id-123',
          name: 'test-operator',
        }),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockImplementation((transformFn) => {
          const transformed = transformFn(mockOperator);
          return Promise.resolve(transformed);
        }),
      };

      mockOperatorModel.findById.mockReturnValue(mockQuery);

      // Act
      const result = await service.getOperator({ operatorId: 'operator-id-123' });

      // Assert
      expect(mockOperatorModel.findById).toHaveBeenCalledWith('operator-id-123');
      expect(mockQuery.select).toHaveBeenCalledWith('-password -__v');
      expect(result).toEqual({
        id: 'operator-id-123',
        name: 'test-operator',
      });
    });

    it('should get operator by name successfully', async () => {
      // Arrange
      const mockOperator = {
        _id: 'operator-id-456',
        name: 'test-operator-name',
        password: 'hashed-password',
        __v: 0,
        toObject: () => ({
          _id: 'operator-id-456',
          name: 'test-operator-name',
        }),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockImplementation((transformFn) => {
          const transformed = transformFn(mockOperator);
          return Promise.resolve(transformed);
        }),
      };

      mockOperatorModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockResolvedValue(null),
      });
      mockOperatorModel.findOne.mockReturnValue(mockQuery);

      // Act
      const result = await service.getOperator({ name: 'test-operator-name' });

      // Assert
      expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ name: 'test-operator-name' });
      expect(mockQuery.select).toHaveBeenCalledWith('-password -__v');
      expect(result).toEqual({
        id: 'operator-id-456',
        name: 'test-operator-name',
      });
    });

    it('should throw NotFoundException when operator not found by operatorId', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockResolvedValue(null),
      };
      mockOperatorModel.findById.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(
        service.getOperator({ operatorId: 'non-existent-id' })
      ).rejects.toThrow(NotFoundException);
      expect(mockOperatorModel.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should throw NotFoundException when operator not found by name', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockResolvedValue(null),
      };
      mockOperatorModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockResolvedValue(null),
      });
      mockOperatorModel.findOne.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(
        service.getOperator({ name: 'non-existent-name' })
      ).rejects.toThrow(NotFoundException);
      expect(mockOperatorModel.findOne).toHaveBeenCalledWith({ name: 'non-existent-name' });
    });

    it('should throw Error when neither operatorId nor name is provided', async () => {
      // Act & Assert
      await expect(service.getOperator({})).rejects.toThrow(
        'Either operatorId or name must be provided'
      );
    });

    it('should prioritize operatorId over name when both are provided', async () => {
      // Arrange
      const mockOperator = {
        _id: 'operator-id-123',
        name: 'test-operator',
        password: 'hashed-password',
        __v: 0,
        toObject: () => ({
          _id: 'operator-id-123',
          name: 'test-operator',
        }),
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockImplementation((transformFn) => {
          const transformed = transformFn(mockOperator);
          return Promise.resolve(transformed);
        }),
      };

      mockOperatorModel.findById.mockReturnValue(mockQuery);

      // Act
      const result = await service.getOperator({
        operatorId: 'operator-id-123',
        name: 'some-name',
      });

      // Assert
      expect(mockOperatorModel.findById).toHaveBeenCalledWith('operator-id-123');
      expect(mockOperatorModel.findOne).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 'operator-id-123',
        name: 'test-operator',
      });
    });

    it('should handle operator without toObject method', async () => {
      // Arrange
      const mockOperator = {
        _id: 'operator-id-789',
        name: 'test-operator-plain',
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        transform: jest.fn().mockImplementation((transformFn) => {
          const transformed = transformFn(mockOperator);
          return Promise.resolve(transformed);
        }),
      };

      mockOperatorModel.findById.mockReturnValue(mockQuery);

      // Act
      const result = await service.getOperator({ operatorId: 'operator-id-789' });

      // Assert
      expect(result).toEqual(mockOperator);
    });
  });
});
