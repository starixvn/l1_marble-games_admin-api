import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId,  } from "mongoose";


export interface GameConfigJsonSchema {
  gameId: number;
  schema: object;
}

export type GameConfigJsonSchemaDocument = GameConfigJsonSchema & Document<ObjectId>;

@Schema()
export class GameConfigJsonSchema {
  @Prop({ type: Number, required: true })
  gameId: number;

  @Prop({ type: Object, required: true })
  schema: object;
} 

export const GameConfigJsonSchemaSchema = SchemaFactory.createForClass(GameConfigJsonSchema);