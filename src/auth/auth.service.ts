import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { ConfigKeys } from '../config/config-keys';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Account, AccountDocument, } from './schema/account.schema';
import { generateRandomPassword } from '../utils/random';
import { Role } from '../common/enums/role.enum';

const SALT_ROUND = 10;

interface AccountCredentialParams {
  username: string;
  password?: string;
}

interface JwtPayload {
  id: string;
  role: Role;
}

export interface CreateAccountParams {
  username: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly expireIn: string;

  constructor(
    @Inject(ConfigService) configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(Account.name) 
    private readonly accountModel: Model<AccountDocument>,
  ) {
    this.expireIn = configService.get(ConfigKeys.Jwt).signOptions.expireIn;
  }

  async validateAccount({
    username,
    password,
  }: AccountCredentialParams): Promise<{ id: string, role: Role } | null> {
    if (!password) {
      return null;
    }

    const account = await this.getAccount(username);

    if (!account) {
      return null;
    }

    const isPasswordMatch = await compare(password, account.password);

    return isPasswordMatch 
    ? { id: (account._id as unknown as string).toString(), role: account.role } 
    : null;
  }

  async generateJwt(user: JwtPayload): Promise<string> {
    const payload = { id: user?.id, role: user?.role };
    
    const token = await this.jwtService.signAsync(payload, {
      subject: user.id,
      expiresIn: this.expireIn,
    });
    
    return token;
  }

  async oneTimeRegister() {
    const username = "admin";
    
    const existingAccount = await this.getAccount(username);

    if (existingAccount) {
      throw new BadRequestException('Only one admin account is allowed');
    }

    const password = generateRandomPassword();

    const hashedPassword = await hash(password, SALT_ROUND);

    const newAccount = new this.accountModel({
      username: username,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await newAccount.save();

    return {
      username,
      password,
    }
  }

  async changePassword(userId: string) {

    const existingAccount = await this.getAccountById(userId);

    if (!existingAccount) {
      throw new UnauthorizedException('Account not found');
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    existingAccount.password = hashedPassword;

    await existingAccount.save();

    return {
      username: existingAccount.username,
      password,
    }
  }
  
  async createAccount(args: CreateAccountParams) {
    const existingAccount = await this.getAccount(args.username);

    if (existingAccount) {
      throw new ConflictException('Account already exists');
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    const newAccount = new this.accountModel({
      username: args.username,
      password: hashedPassword,
      role: args.role,
    });

    await newAccount.save();

    return {
      username: args.username,
      password,
    }
  }

  private async getAccount(username: string): Promise<AccountDocument | null> {
    return this.accountModel.findOne({ username });
  }

  private async getAccountById(userId: string): Promise<AccountDocument | null> {
    return this.accountModel.findById(userId);
  }
}
