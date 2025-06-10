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

    // Create a mock class instead of using `this` typing issues
    class MockOperatorModel {
      password: string;
      name?: string;
      _id: any = 'test-id';
      save = jest.fn().mockReturnValue(this);

      constructor(dto: any) {
        this.password = dto.password;
        this.name = dto.name;
      }

      static readonly findById = jest.fn();
      static readonly findOne = jest.fn();
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
      mockOperatorModel.findById.mockResolvedValue(foundOperator);

      // Act
      await service.updateName({ operatorId: 'operator-id-123', name: 'new-name' });

      // Assert
      expect(mockOperatorModel.findById).toHaveBeenCalledWith('operator-id-123');
      expect(foundOperator.save).toHaveBeenCalled();
      expect(foundOperator.name).toBe('new-name');
    });

    it('should throw NotFoundException if operator not found', async () => {
      // Arrange
      mockOperatorModel.findById.mockResolvedValue(null);

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
      
      jest.spyOn(service, 'getOperatorByName').mockResolvedValue(existingOperator as any);
      mockOperatorModel.findById.mockResolvedValue(operatorToUpdate);

      // Act
      const promise = service.updateName({ operatorId: 'operator-id-123', name: 'duplicate-name' });

      // Assert
      await expect(promise).rejects.toThrow(ConflictException);
      expect(service.getOperatorByName).toHaveBeenCalledWith('duplicate-name');
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
      mockOperatorModel.findById.mockResolvedValue(foundOperator);

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
      mockOperatorModel.findById.mockResolvedValue(null);
      mockOperatorModel.findOne.mockResolvedValue(foundOperator);

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
      mockOperatorModel.findById.mockResolvedValue(null);
      mockOperatorModel.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.changePassword({ operatorId: 'non-existent-id' })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
