import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { GameConfigSchemaController } from "./game-config-schema.controller";
import { GameConfigSchemaService } from "./game-config-schema.service";
import {
  GameConfigJsonSchema,
  GameConfigJsonSchemaSchema,
} from "./schema/game-config-schema.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GameConfigJsonSchema.name,
        schema: GameConfigJsonSchemaSchema,
        collection: "game_config_schemas",
      },
    ]),
  ],
  controllers: [GameConfigSchemaController],
  providers: [GameConfigSchemaService],
  exports: [MongooseModule, GameConfigSchemaService],
})
export class GameConfigSchemaModule {}
