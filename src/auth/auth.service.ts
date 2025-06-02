import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { compare, hash } from 'bcryptjs';
import { ConfigKeys } from '../config/config-keys';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId } from 'mongoose';
import { Account, AccountDocument } from './schema/account.schema';
import { generateRandomPassword } from '../utils/random';

const SALT_ROUND = 10;

interface AccountCredentialParams {
  username: string;
  password?: string;
}

interface JwtPayload {
  id: string
}

@Injectable()
export class AuthService {
  private readonly expireIn: string;

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectModel(Account.name) 
    private readonly accountModel: Model<AccountDocument>,
  ) {
    this.expireIn = configService.get(ConfigKeys.Jwt).signOptions.expireIn;
  }

  async validateAccount({
    username,
    password,
  }: AccountCredentialParams): Promise<string | null> {
    if (!password) {
      return null;
    }

    const account = await this.getAccount(username);

    if (!account) {
      return null;
    }

    const isPasswordMatch = await compare(password, account.password);

    return isPasswordMatch ? (account._id.toString()) : null;
  }

  async generateJwt(user: JwtPayload): Promise<string> {
    const payload = { id: user?.id };
    
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
    });

    await newAccount.save();

    return {
      username,
      password,
    }
  }

  async changePassword() {
    const username = "admin";

    const existingAccount = await this.getAccount(username);

    if (!existingAccount) {
      throw new BadRequestException('Admin account not found');
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    existingAccount.password = hashedPassword;

    await existingAccount.save();

    return {
      username,
      password,
    }
  }

  private async getAccount(username: string): Promise<AccountDocument | null> {
    return this.accountModel.findOne({ username });
  }
}
