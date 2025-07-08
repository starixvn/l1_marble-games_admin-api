import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId } from "mongoose";

export interface OperatorConfig {
  productCodes: string[];
}

export type OperatorDocument = OperatorCredential & Document<ObjectId>;

@Schema()
export class OperatorCredential {
  @Prop({ type: String, required: false })
  name?: string;

  @Prop({ type: String })
  password: string;
}

export const OperatorSchema = SchemaFactory.createForClass(OperatorCredential);
