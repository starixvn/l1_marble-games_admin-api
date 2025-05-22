import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
  alias?: string;
};

export type UpdateAliasArgs = {
  operatorId: string;
  alias: string;
}

export type OperatorCreateResponse = {
  operatorId: string;
  password: string;
};

export type ChangePasswordArgs = {
  operatorId?: string;
  alias?: string;
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
      alias: options?.alias,
    });

    await newOperator.save();

    return {
      operatorId: (newOperator._id as unknown as string).toString(),
      password: password,
    };
  }

  async updateAlias(args: UpdateAliasArgs) {
    const { operatorId, alias } = args;

    const operator = await this.operatorModel.findById(operatorId);

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    operator.alias = alias;

    await operator.save();;
  }
 
  async changePassword(args: ChangePasswordArgs) {
    const { operatorId, alias } = args;

    if (!operatorId && !alias) {
      throw new BadRequestException('Either operatorId or alias must be provided');
    }

    const operator = 
      operatorId && await this.operatorModel.findById(operatorId) ||
      alias && await this.operatorModel.findOne({ alias })

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
}
