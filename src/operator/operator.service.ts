import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  OperatorCredential,
  OperatorDocument,
} from './schema/operator-credential.schema';
import { Model } from 'mongoose';
import { hash } from 'bcryptjs';
import { generateRandomPassword } from 'src/utils/random';

const SALT_ROUND = 10;

export type OperatorCreateOptions = {
  configs: {
    productCodes: Array<string>;
  };
};

const defaultOperatorCreateOptions: OperatorCreateOptions = {
  configs: {
    productCodes: ['Spinner_Soccer'],
  },
};

export type OperatorCreateResponse = {
  operatorId: string;
  password: string;
};

@Injectable()
export class OperatorService {
  constructor(
    @InjectModel(OperatorCredential.name)
    private readonly operatorModel: Model<OperatorDocument>,
  ) {}

  async createOperator(
    options: OperatorCreateOptions = defaultOperatorCreateOptions,
  ): Promise<OperatorCreateResponse> {
    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    const newOperator = new this.operatorModel({
      password: hashedPassword,
      configs: options,
    });

    await newOperator.save();

    return {
      operatorId: newOperator._id.toString(),
      password: password,
    };
  }
}
