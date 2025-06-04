import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { GameConfig, GameConfigDocument } from "./schema/game-config.schema";
import { Model } from "mongoose";
import { GameConfigSchemaService } from "../game-config-schema/game-config-schema.service";

@Injectable()
export class GameConfigService {
  constructor(
    @InjectModel(GameConfig.name)
    private readonly gameConfigModel: Model<GameConfigDocument>,
    @Inject(GameConfigSchemaService)
    private readonly gameConfigSchemaService: GameConfigSchemaService
  ) {}
  
  async upsertGameConfig(gameId: number, config: object) {
    await this.gameConfigSchemaService.validateGameConfigSchema({ gameId, config });
    return this.gameConfigModel.findOneAndUpdate({
      gameId: Number(gameId)
    }, {
      $set: {
        config
      }
    }, {
      upsert: true,
      new: true
    }).select('-_id -__v');

  }

}