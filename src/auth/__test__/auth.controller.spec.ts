import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { AuthDto, AuthResponseDto, AccountResponseDto, CreateAccountDto } from '../dto/auth.dto';
import { Role } from '../schema/account.schema';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateAccount: jest.fn(),
    generateJwt: jest.fn(),
    oneTimeRegister: jest.fn(),
    changePassword: jest.fn(),
    createAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('should return access token when credentials are valid', async () => {
      // arrange
      const loginDto: AuthDto = { username: 'test', password: 'password' };
      const mockAccount = { id: 1, role: Role.ADMIN };
      const mockToken = 'jwt-token';
      const expected: AuthResponseDto = { access_token: mockToken };

      mockAuthService.validateAccount.mockResolvedValue(mockAccount);
      mockAuthService.generateJwt.mockResolvedValue(mockToken);

      // act
      const result = await controller.login(loginDto);

      // assert
      expect(result).toEqual(expected);
      expect(mockAuthService.validateAccount).toHaveBeenCalledWith(loginDto);
      expect(mockAuthService.generateJwt).toHaveBeenCalledWith({ id: mockAccount.id, role: mockAccount.role });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      // arrange
      const loginDto: AuthDto = { username: 'test', password: 'wrong' };
      mockAuthService.validateAccount.mockResolvedValue(null);

      // act & assert
      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('oneTimeRegister', () => {
    it('should return account response', async () => {
      // arrange
      const expected: AccountResponseDto = { username: 'test', password: 'password' };
      mockAuthService.oneTimeRegister.mockResolvedValue(expected);

      // act
      const result = await controller.oneTimeRegister();

      // assert
      expect(result).toEqual(expected);
      expect(mockAuthService.oneTimeRegister).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should return account response after changing password', async () => {
      // arrange
      const mockRequest = { user: { id: 1 } };
      const expected: AccountResponseDto = { username: 'test', password: 'newpassword' };
      mockAuthService.changePassword.mockResolvedValue(expected);

      // act
      const result = await controller.changePassword(mockRequest);

      // assert
      expect(result).toEqual(expected);
      expect(mockAuthService.changePassword).toHaveBeenCalledWith(mockRequest.user.id);
    });
  });

  describe('createAccount', () => {
    it('should return created account response', async () => {
      // arrange
      const createAccountDto: CreateAccountDto = { username: 'test', role: Role.ADMIN };
      const expected: AccountResponseDto = { username: 'test', password: 'password' };
      mockAuthService.createAccount.mockResolvedValue(expected);

      // act
      const result = await controller.createAccount(createAccountDto);

      // assert
      expect(result).toEqual(expected);
      expect(mockAuthService.createAccount).toHaveBeenCalledWith(createAccountDto);
    });
  });
});
