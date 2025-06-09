import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId,  } from "mongoose";


export interface GameConfigJsonSchema {
  name: string;
  schema: object;
  uiSchema: object;
}

export type GameConfigJsonSchemaDocument = GameConfigJsonSchema & Document<ObjectId>;

@Schema()
export class GameConfigJsonSchema {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: Object, required: true })
  schema: object;

  @Prop({ type: Object, required: true })
  uiSchema: object;
} 

export const GameConfigJsonSchemaSchema = SchemaFactory.createForClass(GameConfigJsonSchema);