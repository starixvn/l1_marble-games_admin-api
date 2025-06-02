import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { GameIntegration, GameIntegrationDocument } from "./schema/game-integration.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { GameIntegrationUpdateRequestDto } from "./dto/game-integration-update-request.dto";
import { GameIntegrationQueryDto } from "./dto/game-integration-query.dto";
import { OperatorCredential, OperatorDocument } from "../operator/schema/operator-credential.schema";

@Injectable()
export class GameIntegrationService {
  constructor(
    @InjectModel(GameIntegration.name)
    private readonly gameIntegrationModel: Model<GameIntegrationDocument>,
    @InjectModel(OperatorCredential.name)
    private readonly operatorModel: Model<OperatorDocument>,
  ) {}

  async upsertGameIntegration(query: GameIntegrationQueryDto, updateRequest: GameIntegrationUpdateRequestDto) {
    const operatorId = await this.getOperator(query);

    return this.updateOrCreateGameIntegration(operatorId as unknown as string, query.gameId, updateRequest);
  }

  private async updateOrCreateGameIntegration(operatorId: string, gameId: number, updateRequest: GameIntegrationUpdateRequestDto) {
    let gameIntegration = await this.gameIntegrationModel.findOne({ operatorId, gameId });

    if (!gameIntegration) {
      gameIntegration = await this.gameIntegrationModel.create({
        operatorId,
        gameId,
        ...updateRequest,
      });
    } else {
      gameIntegration = await this.gameIntegrationModel.findOneAndUpdate(
        { _id: gameIntegration._id }, 
        { $set: updateRequest },
        { new: true }
      );
    }

    if (!gameIntegration) {
      throw new InternalServerErrorException('Update failed');
    }

    return gameIntegration.toObject();
  }

  private async getOperator(query: GameIntegrationQueryDto) {
    let operatorQuery: { _id: string } | { alias: string } | null = null;
    
    if (query.operatorId) {
      operatorQuery = { _id: query.operatorId };
    } else if (query.alias) {
      operatorQuery = { alias: query.alias };
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
}
