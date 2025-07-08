import { InjectModel } from "@nestjs/mongoose";
import { GameConfig, GameConfigDocument } from "./schema/game-config.schema";
import { Model } from "mongoose";
import { GameConfigSchemaService } from "../game-config-schema/game-config-schema.service";
import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { AdminLogService } from "../admin-log/admin-log.service";
import { AdminLogActions } from "../admin-log/constants";

export type UpsertGameConfigArgs = {
  schemaId?: string;
  gameId: number;
  config: object;
};

@Injectable()
export class GameConfigService {
  constructor(
    @InjectModel(GameConfig.name)
    private readonly gameConfigModel: Model<GameConfigDocument>,
    @Inject(GameConfigSchemaService)
    private readonly gameConfigSchemaService: GameConfigSchemaService,
    @Inject(AdminLogService)
    private readonly adminLogService: AdminLogService,
  ) {}

  async getGameConfigByGameId(gameId: number) {
    const gameConfig = await this.getNullableGameConfigByGameId(gameId);

    if (!gameConfig) {
      throw new NotFoundException(
        `Game config not found for gameId: ${gameId}`,
      );
    }

    return gameConfig;
  }

  async getNullableGameConfigByGameId(gameId: number) {
    return this.gameConfigModel
      .findOne({ gameId: Number(gameId) })
      .select("-_id -__v");
  }

  async getAllGameConfigs() {
    return this.gameConfigModel.find().select("-_id -__v");
  }

  async upsertGameConfig(args: UpsertGameConfigArgs) {
    const { schemaId, gameId, config } = args;

    await this.gameConfigSchemaService.validateGameConfigSchema({
      id: schemaId,
      config,
    });

    const oldGameConfig = (
      await this.getNullableGameConfigByGameId(gameId)
    )?.toObject();

    const newConfig = await this.gameConfigModel
      .findOneAndUpdate(
        {
          gameId: Number(gameId),
        },
        {
          $set: {
            config,
            gameConfigSchema: schemaId,
          },
        },
        {
          upsert: true,
          new: true,
        },
      )
      .select("-_id -__v");

    const action = oldGameConfig
      ? AdminLogActions.UPDATE
      : AdminLogActions.INSERT;

    void this.adminLogService.createLog({
      author: "admin",
      resource: "game-config",
      action,
      diff: {
        old: oldGameConfig,
        new: newConfig,
      },
    });

    return newConfig;
  }
}
