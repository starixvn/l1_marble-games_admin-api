import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  OperatorCredential,
  OperatorDocument,
} from "./schema/operator-credential.schema";
import { Model } from "mongoose";
import { hash } from "bcryptjs";
import { generateRandomPassword } from "../utils/random";
import { AdminLogService } from "../admin-log/admin-log.service";
import { AdminLogActions } from "../admin-log/constants";

const SALT_ROUND = 10;

export type OperatorCreateOptions = {
  name?: string;
};

export type UpdateNameArgs = {
  operatorId: string;
  name: string;
};

export type GetOperatorArgs = {
  operatorId?: string;
  name?: string;
};

export type OperatorCreateResponse = {
  operatorId: string;
  password: string;
  name?: string;
};

export type GeneratePasswordArgs = {
  operatorId?: string;
  name?: string;
};

const PASSWORD_FILTER = "-password -__v";

enum OperatorError {
  NOT_FOUND = "Operator not found",
  CONFLICT = "Operator with this name already exists",
  ID_OR_NAME_REQUIRED = "Either operatorId or name must be provided",
}

@Injectable()
export class OperatorService {
  constructor(
    @InjectModel(OperatorCredential.name)
    private readonly operatorModel: Model<OperatorDocument>,
    @Inject(AdminLogService)
    private readonly adminLogService: AdminLogService,
  ) {}

  async createOperator(
    options?: OperatorCreateOptions,
  ): Promise<OperatorCreateResponse> {
    if (options?.name) {
      const existingOperator = await this.operatorModel
        .findOne({ name: options.name })
        .select(PASSWORD_FILTER);
      if (existingOperator) {
        throw new ConflictException(OperatorError.CONFLICT);
      }
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    const newOperator = new this.operatorModel({
      password: hashedPassword,
      name: options?.name,
    });

    await newOperator.save();

    void this.adminLogService.createLog({
      resource: "operator",
      action: AdminLogActions.INSERT,
      diff: {
        new: {
          id: newOperator._id,
          password: "NEW_PASSWORD",
          name: options?.name,
        },
      },
    });

    return {
      operatorId: (newOperator._id as unknown as string).toString(),
      password: password,
      name: options?.name,
    };
  }

  async updateName(args: UpdateNameArgs) {
    const { operatorId, name } = args;

    const existingOperator = await this.operatorModel
      .findOne({ name })
      .select(PASSWORD_FILTER);

    if (existingOperator) {
      throw new ConflictException(OperatorError.CONFLICT);
    }

    const operator = await this.operatorModel.findById(operatorId);

    if (!operator) {
      throw new NotFoundException(OperatorError.NOT_FOUND);
    }

    const oldName = operator.name ?? "";
    operator.name = name;

    await operator.save();

    void this.adminLogService.createLog({
      resource: "operator",
      action: AdminLogActions.UPDATE,
      diff: {
        old: {
          id: operatorId,
          name: oldName,
          password: "UNCHANGED",
        },
        new: {
          id: operatorId,
          name: name,
          password: "UNCHANGED",
        },
      },
    });
  }

  async generatePassword(args: GeneratePasswordArgs) {
    const { operatorId, name } = args;

    if (!operatorId && !name) {
      throw new BadRequestException(OperatorError.ID_OR_NAME_REQUIRED);
    }

    const operator =
      (operatorId && (await this.operatorModel.findById(operatorId))) ||
      (name && (await this.operatorModel.findOne({ name })));

    if (!operator) {
      throw new NotFoundException(OperatorError.NOT_FOUND);
    }

    const password = generateRandomPassword();
    const hashedPassword = await hash(password, SALT_ROUND);

    operator.password = hashedPassword;

    await operator.save();

    void this.adminLogService.createLog({
      resource: "operator",
      action: AdminLogActions.UPDATE,
      diff: {
        old: {
          id: (operator._id as unknown as string).toString(),
          name: operator.name,
          password: "OLD_PASSWORD",
        },
        new: {
          id: (operator._id as unknown as string).toString(),
          name: operator.name,
          password: "NEW_PASSWORD",
        },
      },
    });

    return {
      operatorId: (operator._id as unknown as string).toString(),
      password,
    };
  }

  async getOperator(args: GetOperatorArgs) {
    const { operatorId, name } = args;

    if (operatorId) {
      const operator = await this.getOperatorById(operatorId);
      if (!operator) {
        throw new NotFoundException(OperatorError.NOT_FOUND);
      }
      return operator;
    }

    if (name) {
      const operator = await this.getOperatorByName(name);
      if (!operator) {
        throw new NotFoundException(OperatorError.NOT_FOUND);
      }
      return operator;
    }

    throw new Error(OperatorError.ID_OR_NAME_REQUIRED); // this is developer fault to not provide either operatorId or name
  }

  async getAllOperators() {
    return this.operatorModel.aggregate([
      {
        $project: {
          id: "$_id",
          _id: 0,
          name: 1,
        },
      },
    ]);
  }
  private async getOperatorById(operatorId: string) {
    return this.filterOperatorFields(this.operatorModel.findById(operatorId));
  }

  private async getOperatorByName(name: string) {
    return this.filterOperatorFields(this.operatorModel.findOne({ name }));
  }

  private filterOperatorFields(
    query: ReturnType<typeof this.operatorModel.findOne>,
  ) {
    return query.select(PASSWORD_FILTER).transform((doc) => {
      if (doc && typeof (doc as OperatorDocument).toObject === "function") {
        const obj = (doc as OperatorDocument).toObject();
        const { _id, ...rest } = obj;
        return { id: _id.toString(), ...rest };
      }
      return doc;
    });
  }
}
