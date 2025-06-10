import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  OperatorCredential,
  OperatorDocument,
} from './schema/operator-credential.schema';
import { Model } from 'mongoose';
import { hash } from 'bcryptjs';
import { generateRandomPassword } from '../utils/random';

const SALT_ROUND = 10;

export type OperatorCreateOptions = {
  name?: string;
};

export type UpdateNameArgs = {
  operatorId: string;
  name: string;
}

export type OperatorCreateResponse = {
  operatorId: string;
  password: string;
};

export type ChangePasswordArgs = {
  operatorId?: string;
  name?: string;
}

@Injectable()
export class OperatorService {
  constructor(
    @InjectModel(OperatorCredential.name)
    private readonly operatorModel: Model<OperatorDocument>,
  ) {}

  async createOperator(
    options?: OperatorCreateOptions,
  ): Promise<OperatorCreateResponse> {
    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    const newOperator = new this.operatorModel({
      password: hashedPassword,
      name: options?.name,
    });

    await newOperator.save();

    return {
      operatorId: (newOperator._id as unknown as string).toString(),
      password: password,
    };
  }

  async updateName(args: UpdateNameArgs) {
    const { operatorId, name } = args;

    const existingOperator = await this.getOperatorByName(name);

    if (existingOperator) {
      throw new ConflictException('Operator with this name already exists');
    }

    const operator = await this.operatorModel.findById(operatorId);

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    operator.name = name;

    await operator.save();
  }
 
  async changePassword(args: ChangePasswordArgs) {
    const { operatorId, name } = args;

    if (!operatorId && !name) {
      throw new BadRequestException('Either operatorId or name must be provided');
    }

    const operator = 
      operatorId && await this.operatorModel.findById(operatorId) ||
      name && await this.operatorModel.findOne({ name })

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    operator.password = hashedPassword;

    await operator.save();

    return {
      operatorId: (operator._id as unknown as string).toString(),
      password,
    }
  }

  async getOperatorByName(name: string) {
    return this.operatorModel.findOne({ name });
  }
}