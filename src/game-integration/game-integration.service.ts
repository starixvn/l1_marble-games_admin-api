import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { GameIntegration, GameIntegrationDocument } from "./schema/game-integration.schema";
import mongoose, { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { GameIntegrationUpdateRequestDto, MarketIntegrationUpdateRequestDto } from "./dto/game-integration-update-request.dto";
import { GameIntegrationQueryDto } from "./dto/game-integration-query.dto";
import { OperatorCredential, OperatorDocument } from "../operator/schema/operator-credential.schema";
import { MarketIntegration, MarketIntegrationDocument } from "./schema/market-integration.schema";

@Injectable()
export class GameIntegrationService {
  constructor(
    @InjectModel(GameIntegration.name)
    private readonly gameIntegrationModel: Model<GameIntegrationDocument>,
    @InjectModel(MarketIntegration.name)
    private readonly marketIntegrationModel: Model<MarketIntegrationDocument>,
    @InjectModel(OperatorCredential.name)
    private readonly operatorModel: Model<OperatorDocument>,
  ) {}

  async upsertGameIntegration(query: GameIntegrationQueryDto, updateRequest: GameIntegrationUpdateRequestDto) {
    const operatorId = await this.getOperator(query);

    const marketIntegrationToProcess = updateRequest.markets ?? [];

    const processedMarketIntegrations = await this.processMarketIntegrations(marketIntegrationToProcess);

    const processedUpdateRequest = {
      ...updateRequest,
      markets: processedMarketIntegrations,
    };

    return this.updateOrCreateGameIntegration(operatorId as unknown as string, query.gameId, processedUpdateRequest);
  }

  private async updateOrCreateGameIntegration(operatorId: string, gameId: number, updateRequest: any) {
    return this.gameIntegrationModel.findOneAndUpdate(
        { operatorId, gameId }, 
        { $set: updateRequest },
        { upsert: true, new: true }
      ).select('-_id -__v');
  }

  private async getOperator(query: GameIntegrationQueryDto) {
    let operatorQuery: { _id: string } | { name: string } | null = null;
    
    if (query.operatorId) {
      operatorQuery = { _id: query.operatorId };
    } else if (query.name) {
      operatorQuery = { name: query.name };
    }

    if (!operatorQuery) {
      throw new NotFoundException('Operator not found');
    }

    const operator = await this.operatorModel.findOne(operatorQuery).select('_id').lean();
    
    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    return operator._id;
  }

  private async processMarketIntegrations(marketIntegrations: MarketIntegrationUpdateRequestDto[]): Promise<unknown[]> {
    const marketIntegrationIds = await Promise.all(marketIntegrations.map(marketIntegration => this.processMarketIntegration(marketIntegration)));

    return marketIntegrationIds;
  }

  private async processMarketIntegration(marketIntegration: MarketIntegrationUpdateRequestDto) {
    if (!marketIntegration.id) {
      return this.createMarketIntegration(marketIntegration);
    }

    return this.updateMarketIntegration(marketIntegration);
  }

  private async createMarketIntegration(marketIntegration: MarketIntegrationUpdateRequestDto) {
    const newMarketIntegration = await this.marketIntegrationModel.create({
      selections: marketIntegration.selections ?? [],
      merge: marketIntegration.merge ?? {},
      name: marketIntegration.name ?? '',
    });

    if (!newMarketIntegration) {
      throw new InternalServerErrorException('Failed to create market integration');
    }

    return newMarketIntegration._id;
  }

  private async updateMarketIntegration(marketIntegration: MarketIntegrationUpdateRequestDto) {
    if (!marketIntegration.id) {
      throw new Error('Market integration id is required for this function');
    }

    if (!marketIntegration.merge && !marketIntegration.selections && !marketIntegration.name) {
      return mongoose.Types.ObjectId.createFromHexString(marketIntegration.id);
    }

    const updatedMarketIntegration = await this.marketIntegrationModel.findOneAndUpdate(
      { _id: marketIntegration.id },
      { $set: marketIntegration },
      { new: true, upsert: true }
    );

    if (!updatedMarketIntegration) {
      throw new InternalServerErrorException('Failed to update market integration');
    }

    return updatedMarketIntegration._id;
  }
}
