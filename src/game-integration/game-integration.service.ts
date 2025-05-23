import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { GameIntegration, GameIntegrationDocument } from "./schema/game-integration.schema";
import { Model, Types } from "mongoose";
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


    if (!query.operatorId && !query.alias) {
      throw new BadRequestException('Operator ID or alias is required');
    }

    const operatorId = 
      query.operatorId 
        ? new Types.ObjectId(query.operatorId) 
        : (await this.operatorModel.findOne({ alias: query.alias }).select('_id').lean())?._id;
    if (!operatorId) {
      throw new NotFoundException('Operator not found');
    }

    let gameIntegration = await this.gameIntegrationModel.findOne({ operatorId, gameId: query.gameId });

    if (!gameIntegration) {
      gameIntegration = await this.gameIntegrationModel.create({
        operatorId,
        gameId: query.gameId,
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
}