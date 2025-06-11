import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { GameConfigJsonSchema, GameConfigJsonSchemaDocument } from "./schema/game-config-schema.schema";
import Ajv from "ajv";

export type UpsertGameConfigSchemaArgs = {
  id?: string;
  schema: object;
  name: string;
  uiSchema?: object;
}

export type ValidateGameConfigSchemaArgs = {
  id?: string;
  config: object;
}

export const DEFAULT_GAME_CONFIG_SCHEMA = {
  "type": "object",
  "properties": {
    "enabled": {
      "type": "boolean"
    }
  },
  "required": [
    "enabled"
  ]
}

@Injectable()
export class GameConfigSchemaService {
  private readonly ajv = new Ajv();

  constructor(
    @InjectModel(GameConfigJsonSchema.name)
    private readonly gameConfigJsonSchemaModel: Model<GameConfigJsonSchemaDocument>
  ) {}

  async getGameConfigSchema(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ObjectId format: ${id}`);
    }
    
    const schema = await this.gameConfigJsonSchemaModel.findById(id).select('-__v');
    if (!schema) {
      throw new NotFoundException(`Game config schema not found for id: ${id}`);
    }
    return schema;
  }

  async getAllGameConfigSchemas() {
    return this.gameConfigJsonSchemaModel.find().select('-__v -schema -uiSchema');
  }

  async upsertGameConfigSchema(args: UpsertGameConfigSchemaArgs) {
    const { id, schema, name, uiSchema } = args;

    if (id) {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(`Invalid ObjectId format: ${id}`);
      }
      
      return this.gameConfigJsonSchemaModel.findByIdAndUpdate(
        id, { schema, name, uiSchema }, { new: true }
      ).select('-__v');
    }
    
    const newSchema = new this.gameConfigJsonSchemaModel({
      schema,
      name,
      uiSchema
    });
    const saved = await newSchema.save();
    return saved.toObject({ transform: (_, ret) => { delete ret.__v; return ret; } });
  }

  async validateGameConfigSchema(args: ValidateGameConfigSchemaArgs) {
    const { id, config } = args;

    if (!id) {
      return this.valideteConfig(config, DEFAULT_GAME_CONFIG_SCHEMA);
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ObjectId format: ${id}`);
    }

    const gameConfigSchema = await this.gameConfigJsonSchemaModel.findById(id);

    if (!gameConfigSchema) {
      throw new NotFoundException(`Game config schema not found for id: ${id}`);
    }

    return this.valideteConfig(config, gameConfigSchema.schema);
  }

  private async valideteConfig(config: object, schema: object) {
    const validate = this.ajv.compile(schema);

    const isValid = validate(config);

    if (!isValid) {
      throw new BadRequestException({
        validationErrors: validate.errors,
        config,
        schema
      });
    }
  }
}
