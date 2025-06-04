import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";

export type GameConfigDocument = GameConfig & Document<ObjectId>

@Schema()
export class GameConfig {

  @Prop({ type: Number, required: true })
  gameId: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: true})
  config: object;
}

export const GameConfigSchema = SchemaFactory.createForClass(GameConfig);
