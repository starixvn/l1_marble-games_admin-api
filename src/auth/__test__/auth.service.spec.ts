import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Account, Role } from '../schema/account.schema';
import { Model } from 'mongoose';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let accountModel: Model<Account>;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue({ signOptions: { expireIn: '1h' } }),
  };

  const mockAccountModel = jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue(data),
  })) as unknown as Model<Account>;

  (mockAccountModel as any).findOne = jest.fn().mockResolvedValue(null);
  (mockAccountModel as any).findById = jest.fn().mockResolvedValue(null);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getModelToken(Account.name), useValue: mockAccountModel },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    accountModel = module.get<Model<Account>>(getModelToken(Account.name));
  });

  describe('validateAccount', () => {
    it('should return null when password is not provided', async () => {
      // arrange
      const params = { username: 'test' };

      // act
      const result = await service.validateAccount(params);

      // assert
      expect(result).toBeNull();
    });

    it('should return null when account is not found', async () => {
      // arrange
      const params = { username: 'test', password: 'password' };
      (mockAccountModel as any).findOne.mockResolvedValue(null);

      // act
      const result = await service.validateAccount(params);

      // assert
      expect(result).toBeNull();
    });

    it('should return null when password does not match', async () => {
      // arrange
      const params = { username: 'test', password: 'password' };
      const mockAccount = {
        _id: '123',
        role: Role.ADMIN,
        password: 'hashedPassword',
      };
      (mockAccountModel as any).findOne.mockResolvedValue(mockAccount);
      (compare as jest.Mock).mockResolvedValue(false);

      // act
      const result = await service.validateAccount(params);

      // assert
      expect(result).toBeNull();
    });

    it('should return account info when credentials are valid', async () => {
      // arrange
      const params = { username: 'test', password: 'password' };
      const mockAccount = {
        _id: '123',
        role: Role.ADMIN,
        password: 'hashedPassword',
      };
      (mockAccountModel as any).findOne.mockResolvedValue(mockAccount);
      (compare as jest.Mock).mockResolvedValue(true);

      // act
      const result = await service.validateAccount(params);

      // assert
      expect(result).toEqual({ id: '123', role: Role.ADMIN });
    });
  });

  describe('generateJwt', () => {
    it('should generate JWT token', async () => {
      // arrange
      const user = { id: '123', role: Role.ADMIN };
      const expectedToken = 'jwt-token';
      mockJwtService.signAsync.mockResolvedValue(expectedToken);

      // act
      const result = await service.generateJwt(user);

      // assert
      expect(result).toBe(expectedToken);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { id: user.id, role: user.role },
        { subject: user.id, expiresIn: '1h' }
      );
    });
  });

  describe('oneTimeRegister', () => {
    it('should throw BadRequestException when admin account exists', async () => {
      // arrange
      (mockAccountModel as any).findOne.mockResolvedValue({ username: 'admin' });

      // act
      const result = service.oneTimeRegister();

      // assert
      await expect(result).rejects.toThrow(BadRequestException);
    });

    it('should create admin account with random password', async () => {
      // arrange
      (mockAccountModel as any).findOne.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue('hashedPassword');

      // act
      const result = await service.oneTimeRegister();

      // assert
      expect(result).toEqual({
        username: 'admin',
        password: expect.any(String),
      });
      expect(accountModel.prototype.constructor).toHaveBeenCalledWith({
        username: 'admin',
        password: 'hashedPassword',
        role: Role.ADMIN,
      });
    });
  });

  describe('changePassword', () => {
    it('should throw UnauthorizedException when account not found', async () => {
      // arrange
      (mockAccountModel as any).findById.mockResolvedValue(null);

      // act
      const result = service.changePassword('123');

      // assert
      await expect(result).rejects.toThrow(UnauthorizedException);
    });

    it('should change password and return new credentials', async () => {
      // arrange
      const mockAccount = {
        username: 'test',
        password: 'oldPassword',
        save: jest.fn().mockResolvedValue(true),
      };
      (mockAccountModel as any).findById.mockResolvedValue(mockAccount);
      (hash as jest.Mock).mockResolvedValue('newHashedPassword');

      // act
      const result = await service.changePassword('123');

      // assert
      expect(result).toEqual({
        username: 'test',
        password: expect.any(String),
      });
      expect(mockAccount.password).toBe('newHashedPassword');
      expect(mockAccount.save).toHaveBeenCalled();
    });
  });

  describe('createAccount', () => {
    it('should throw ConflictException when account exists', async () => {
      // arrange
      (mockAccountModel as any).findOne.mockResolvedValue({ username: 'test' });

      // act
      const result = service.createAccount({ username: 'test', role: Role.ADMIN });

      // assert
      await expect(result).rejects.toThrow(ConflictException);
    });

    it('should create new account with random password', async () => {
      // arrange
      (mockAccountModel as any).findOne.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue('hashedPassword');

      // act
      const result = await service.createAccount({ username: 'test', role: Role.ADMIN });

      // assert
      expect(result).toEqual({
        username: 'test',
        password: expect.any(String),
      });
      expect(accountModel.prototype.constructor).toHaveBeenCalledWith({
        username: 'test',
        password: 'hashedPassword',
        role: Role.ADMIN,
      });
    });
  });
});
