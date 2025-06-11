import { InjectModel } from "@nestjs/mongoose";
import { GameConfig, GameConfigDocument } from "./schema/game-config.schema";
import { Model, Types } from "mongoose";
import { GameConfigSchemaService } from "../game-config-schema/game-config-schema.service";
import { Injectable, Inject, NotFoundException } from "@nestjs/common";

export type UpsertGameConfigArgs = {
  schemaId?: string;
  gameId: number;
  config: object;
}


@Injectable()
export class GameConfigService {

  constructor(
    @InjectModel(GameConfig.name)
    private readonly gameConfigModel: Model<GameConfigDocument>,
    @Inject(GameConfigSchemaService)
    private readonly gameConfigSchemaService: GameConfigSchemaService
  ) {}
  
  async getGameConfigByGameId(gameId: number) {
    const gameConfig = await this.gameConfigModel
      .findOne({ gameId: Number(gameId) })
      .select('-_id -__v');

    if (!gameConfig) {
      throw new NotFoundException(`Game config not found for gameId: ${gameId}`);
    }

    return gameConfig;
  }

  async getAllGameConfigs() {
    return this.gameConfigModel.find().select('-_id -__v');
  }

  async upsertGameConfig(args: UpsertGameConfigArgs) {
    const { schemaId, gameId, config } = args;

    await this.gameConfigSchemaService.validateGameConfigSchema({ id: schemaId, config });

    return this.gameConfigModel.findOneAndUpdate({
      gameId: Number(gameId)
    }, {
      $set: {
        config,
        gameConfigSchema: new Types.ObjectId(schemaId)
      }
    }, {
      upsert: true,
      new: true
    }).select('-_id -__v');
  }
}
