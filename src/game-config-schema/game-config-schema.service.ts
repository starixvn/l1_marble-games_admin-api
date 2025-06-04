import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { GameConfigJsonSchema, GameConfigJsonSchemaDocument } from "./schema/game-config-schema.schema";
import Ajv from "ajv";

export type UpsertGameConfigSchemaArgs = {
  gameId: number;
  schema: object;
}

export type ValidateGameConfigSchemaArgs = {
  gameId: number;
  config: object;
}

@Injectable()
export class GameConfigSchemaService {
  private readonly ajv = new Ajv();

  constructor(
    @InjectModel(GameConfigJsonSchema.name)
    private readonly gameConfigJsonSchemaModel: Model<GameConfigJsonSchemaDocument>
  ) {}

  async upsertGameConfigSchema(args: UpsertGameConfigSchemaArgs) {
    const { gameId, schema } = args;

    const gameConfigSchemaUpdateResult =
      await this.gameConfigJsonSchemaModel.findOneAndUpdate(
        { gameId },
        { schema },
        { upsert: true, new: true }
      ).select('-_id -__v');

    return gameConfigSchemaUpdateResult;
  }

  async validateGameConfigSchema(args: ValidateGameConfigSchemaArgs) {
    const { gameId, config } = args;

    const gameConfigSchema = await this.gameConfigJsonSchemaModel.findOne({ gameId });

    if (!gameConfigSchema) {
      throw new NotFoundException(`Game config schema not found for gameId: ${gameId}`);
    }

    const validate = this.ajv.compile(gameConfigSchema.schema);

    const isValid = validate(config);

    if (!isValid) {
      throw new BadRequestException(validate.errors);
    }
  }
}
