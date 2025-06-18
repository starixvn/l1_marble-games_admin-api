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

export type GetOperatorArgs = {
  operatorId?: string;
  name?: string;
}

export type OperatorCreateResponse = {
  operatorId: string;
  password: string;
  name?: string;
};

export type GeneratePasswordArgs = {
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

    if (options?.name) {
      const existingOperator = await this.operatorModel.findOne({ name: options.name }).select('-password -__v');
      if (existingOperator) {
        throw new ConflictException('Operator with this name already exists');
      }
    }

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
      name: options?.name,
    };
  }

  async updateName(args: UpdateNameArgs) {
    const { operatorId, name } = args;

    const existingOperator = await this.operatorModel.findOne({ name }).select('-password -__v');

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
 
  async generatePassword(args: GeneratePasswordArgs) {
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

  async getOperator(args: GetOperatorArgs) {
    const { operatorId, name } = args;

    if (operatorId) {
      const operator = await this.getOperatorById(operatorId);
      if (!operator) {
        throw new NotFoundException('Operator not found');
      }
      return operator;
    }

    if (name) { 
      const operator = await this.getOperatorByName(name);
      if (!operator) {
        throw new NotFoundException('Operator not found');
      }
      return operator;
    }

    throw new Error('Either operatorId or name must be provided'); // this is developer fault to not provide either operatorId or name
  }

  async getAllOperators() {
    return this
      .operatorModel
      .aggregate([
        {
          $project: {
            "id": "$_id",
            "_id": 0,
            "name": 1,
          }
        }
      ]);
  }
  private async getOperatorById(operatorId: string) {
    return this.filterOperatorFields(this.operatorModel.findById(operatorId));
  }

  private async getOperatorByName(name: string) {
    return this.filterOperatorFields(this.operatorModel.findOne({ name }));
  }

  private filterOperatorFields(query: ReturnType<typeof this.operatorModel.findOne>) {
    return query.select('-password -__v').transform((doc) => {
      if (doc && typeof (doc as any).toObject === 'function') {
        const obj = (doc as OperatorDocument).toObject();
        const { _id, ...rest } = obj;
        return { id: _id.toString(), ...rest };
      }
      return doc;
    });
  }
}