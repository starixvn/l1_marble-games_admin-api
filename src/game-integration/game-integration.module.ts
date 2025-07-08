import { Module, Logger } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  GameIntegration,
  GameIntegrationSchema,
} from "./schema/game-integration.schema";
import {
  MarketIntegration,
  MarketIntegrationSchema,
} from "./schema/market-integration.schema";
import { GameIntegrationService } from "./game-integration.service";
import { GameIntegrationController } from "./game-integration.controller";
import { OperatorModule } from "../operator/operator.module";

@Module({
  imports: [
    OperatorModule,
    MongooseModule.forFeature([
      {
        name: GameIntegration.name,
        schema: GameIntegrationSchema,
        collection: "game_integrations",
      },
      {
        name: MarketIntegration.name,
        schema: MarketIntegrationSchema,
        collection: "market_integrations",
      },
    ]),
  ],
  providers: [GameIntegrationService, Logger],
  controllers: [GameIntegrationController],
  exports: [GameIntegrationService],
})
export class GameIntegrationModule {}
