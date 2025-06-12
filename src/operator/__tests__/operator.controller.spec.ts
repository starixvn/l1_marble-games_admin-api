import { Test, TestingModule } from '@nestjs/testing';
import { OperatorController } from '../operator.controller';
import { OperatorService, OperatorCreateResponse } from '../operator.service';

describe('OperatorController', () => {
  let controller: OperatorController;
  let service: OperatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OperatorController],
      providers: [
        {
          provide: OperatorService,
          useValue: {
            createOperator: jest.fn(),
            updateName: jest.fn(),
            generatePassword: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OperatorController>(OperatorController);
    service = module.get<OperatorService>(OperatorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateOperator', () => {
    it('should call createOperator method from service', async () => {
      // Arrange
      const result: OperatorCreateResponse = { 
        operatorId: 'op-123', 
        password: 'secret-123' 
      };
      jest.spyOn(service, 'createOperator').mockResolvedValue(result);

      // Act
      const response = await controller.createOperator();

      // Assert
      expect(service.createOperator).toHaveBeenCalled();
      expect(response).toEqual(result);
    });
  });

  describe('updateName', () => {
    it('should call updateName method from service with correct parameters', async () => {
      // Arrange
      const updateNameArgs = {
        operatorId: 'op-123',
        name: 'new-name',
      };
      jest.spyOn(service, 'updateName').mockResolvedValue(undefined);

      // Act
      const response = await controller.updateName(updateNameArgs);

      // Assert
      expect(service.updateName).toHaveBeenCalledWith(updateNameArgs);
      expect(response).toBeUndefined();
    });
  });

  describe('changePassword', () => {
    it('should call changePassword method from service with operatorId', async () => {
      // Arrange
      const changePasswordArgs = {
        operatorId: 'op-123',
      };
      const result = { 
        operatorId: 'op-123', 
        password: 'new-password' 
      };
      jest.spyOn(service, 'generatePassword').mockResolvedValue(result);

      // Act
      const response = await controller.generatePassword(changePasswordArgs);

      // Assert
      expect(service.generatePassword).toHaveBeenCalledWith(changePasswordArgs);
      expect(response).toEqual(result);
    });

    it('should call changePassword method from service with name', async () => {
      // Arrange
      const changePasswordArgs = {
        name: 'operator1',
      };
      const result = { 
        operatorId: 'op-123', 
        password: 'new-password' 
      };
      jest.spyOn(service, 'generatePassword').mockResolvedValue(result);

      // Act
      const response = await controller.generatePassword(changePasswordArgs);

      // Assert
      expect(service.generatePassword).toHaveBeenCalledWith(changePasswordArgs);
      expect(response).toEqual(result);
    });
  });
});
