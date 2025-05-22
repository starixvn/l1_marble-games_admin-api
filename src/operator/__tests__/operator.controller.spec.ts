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
            updateAlias: jest.fn(),
            changePassword: jest.fn(),
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
      const response = await controller.generateOperator();

      // Assert
      expect(service.createOperator).toHaveBeenCalled();
      expect(response).toEqual(result);
    });
  });

  describe('updateAlias', () => {
    it('should call updateAlias method from service with correct parameters', async () => {
      // Arrange
      const updateAliasArgs = {
        operatorId: 'op-123',
        alias: 'new-alias',
      };
      jest.spyOn(service, 'updateAlias').mockResolvedValue(undefined);

      // Act
      const response = await controller.updateAlias(updateAliasArgs);

      // Assert
      expect(service.updateAlias).toHaveBeenCalledWith(updateAliasArgs);
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
      jest.spyOn(service, 'changePassword').mockResolvedValue(result);

      // Act
      const response = await controller.changePassword(changePasswordArgs);

      // Assert
      expect(service.changePassword).toHaveBeenCalledWith(changePasswordArgs);
      expect(response).toEqual(result);
    });

    it('should call changePassword method from service with alias', async () => {
      // Arrange
      const changePasswordArgs = {
        alias: 'operator1',
      };
      const result = { 
        operatorId: 'op-123', 
        password: 'new-password' 
      };
      jest.spyOn(service, 'changePassword').mockResolvedValue(result);

      // Act
      const response = await controller.changePassword(changePasswordArgs);

      // Assert
      expect(service.changePassword).toHaveBeenCalledWith(changePasswordArgs);
      expect(response).toEqual(result);
    });
  });
});
