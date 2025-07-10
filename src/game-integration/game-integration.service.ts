import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Inject,
} from "@nestjs/common";
import {
  GameIntegration,
  GameIntegrationDocument,
} from "./schema/game-integration.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import {
  GameIntegrationUpdateRequestDto,
  MarketIntegrationUpdateRequestDto,
} from "./dto/game-integration-update-request.dto";
import { GameIntegrationQueryDto } from "./dto/game-integration-query.dto";
import {
  OperatorCredential,
  OperatorDocument,
} from "../operator/schema/operator-credential.schema";
import {
  MarketIntegration,
  MarketIntegrationDocument,
} from "./schema/market-integration.schema";
import { AdminLogService } from "../admin-log/admin-log.service";
import { AdminLogActions } from "../admin-log/constants";

@Injectable()
export class GameIntegrationService {
  constructor(
    @InjectModel(GameIntegration.name)
    private readonly gameIntegrationModel: Model<GameIntegrationDocument>,
    @InjectModel(MarketIntegration.name)
    private readonly marketIntegrationModel: Model<MarketIntegrationDocument>,
    @InjectModel(OperatorCredential.name)
    private readonly operatorModel: Model<OperatorDocument>,
    @Inject(AdminLogService)
    private readonly adminLogService: AdminLogService,
  ) {}

  async upsertGameIntegration(
    query: GameIntegrationQueryDto,
    updateRequest: GameIntegrationUpdateRequestDto,
  ) {
    const operatorId = await this.getOperator(query);

    const marketIntegrationToProcess = updateRequest.markets ?? [];

    const processedMarketIntegrations = await this.processMarketIntegrations(
      marketIntegrationToProcess,
    );

    const oldGameIntegration = await this.getNullableGameIntegration(query);

    const processedUpdateRequest = {
      ...updateRequest,
      operatorId,
      gameId: query.gameId,
      markets: processedMarketIntegrations,
    };

    await this.updateOrCreateGameIntegration(
      operatorId as unknown as string,
      query.gameId,
      processedUpdateRequest,
    );
    const newGameIntegration = await this.getGameIntegration(query);

    const action = oldGameIntegration
      ? AdminLogActions.UPDATE
      : AdminLogActions.INSERT;

    void this.adminLogService.createLog({
      resource: "game-integration",
      action,
      diff: {
        old: oldGameIntegration ?? undefined,
        new: newGameIntegration,
      },
    });

    return newGameIntegration;
  }

  async listGameIntegrations() {
    return this.gameIntegrationModel
      .find()
      .select("-_id -__v -markets -mergeEvent -mergeEventDetails -patches")
      .lean();
  }

  async deleteGameIntegration(query: GameIntegrationQueryDto) {
    const operatorId = await this.getOperator(query);
    const oldGameIntegration = await this.getGameIntegration(query);

    const result =
      (
        await this.gameIntegrationModel.deleteOne({
          operatorId,
          gameId: query.gameId,
        })
      ).deletedCount > 0;

    void this.adminLogService.createLog({
      resource: "game-integration",
      action: AdminLogActions.DELETE,
      diff: {
        old: oldGameIntegration,
      },
    });

    return result;
  }

  async getGameIntegration(query: GameIntegrationQueryDto) {
    const operatorId = await this.getOperator(query);

    const gameIntegration = await this.gameIntegrationModel
      .findOne({ operatorId, gameId: query.gameId })
      .select("-_id -__v -gameId -operatorId")
      .populate({
        path: "markets",
        select: "-_id -__v",
        transform: (doc) => {
          return doc;
        },
      })
      .lean();

    if (!gameIntegration) {
      throw new NotFoundException("Game integration not found");
    }

    return gameIntegration;
  }

  private async getNullableGameIntegration(query: GameIntegrationQueryDto) {
    const operatorId = await this.getOperator(query);
    return this.gameIntegrationModel
      .findOne({ operatorId, gameId: query.gameId })
      .select("-_id -__v -gameId -operatorId")
      .populate({
        path: "markets",
        select: "-_id -__v",
        transform: (doc) => {
          return doc;
        },
      })
      .lean();
  }

  private async updateOrCreateGameIntegration(
    operatorId: string,
    gameId: number,
    updateRequest: any,
  ) {
    return this.gameIntegrationModel
      .findOneAndUpdate(
        { operatorId, gameId },
        { $set: updateRequest },
        { upsert: true, new: true },
      )
      .select("-_id -__v");
  }

  private async getOperator(query: GameIntegrationQueryDto) {
    let operatorQuery: { _id: string } | { name: string } | null = null;

    if (query.operatorId) {
      operatorQuery = { _id: query.operatorId };
    } else if (query.name) {
      operatorQuery = { name: query.name };
    }

    if (!operatorQuery) {
      throw new NotFoundException("Operator not found");
    }

    const operator = await this.operatorModel
      .findOne(operatorQuery)
      .select("_id")
      .lean();

    if (!operator) {
      throw new NotFoundException("Operator not found");
    }

    return operator._id;
  }

  private async processMarketIntegrations(
    marketIntegrations: MarketIntegrationUpdateRequestDto[],
  ): Promise<unknown[]> {
    const marketIntegrationIds = await Promise.all(
      marketIntegrations.map((marketIntegration) =>
        this.processMarketIntegration(marketIntegration),
      ),
    );

    return marketIntegrationIds;
  }

  private async processMarketIntegration(
    marketIntegration: MarketIntegrationUpdateRequestDto,
  ) {
    return this.updateMarketIntegration(marketIntegration);
  }

  private async updateMarketIntegration(
    marketIntegration: MarketIntegrationUpdateRequestDto,
  ) {
    const merge = marketIntegration.merge ?? {};
    const selections = marketIntegration.selections ?? [];

    const existingMarketIntegration =
      await this.marketIntegrationModel.findOneAndUpdate(
        { name: marketIntegration.name },
        {
          $set: {
            merge,
            selections,
          },
        },
        { new: true, upsert: true },
      );

    if (!existingMarketIntegration) {
      throw new InternalServerErrorException(
        "Failed to create or update market integration",
      );
    }

    return existingMarketIntegration._id;
  }
}
