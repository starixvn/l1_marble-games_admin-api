import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";
import {
  GameConfigJsonSchema,
  GameConfigJsonSchemaDocument,
} from "../../game-config-schema/schema/game-config-schema.schema";
export type GameConfigDocument = GameConfig & Document<ObjectId>;

@Schema()
export class GameConfig {
  @Prop({ type: Number, required: true })
  gameId: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  config: object;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: GameConfigJsonSchema.name,
    required: false,
  })
  gameConfigSchema?: ObjectId | GameConfigJsonSchemaDocument;
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);
