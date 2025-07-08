import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";
import mongoose, {
  ObjectId,
  Document,
  Schema as MongooseSchema,
} from "mongoose";
import { MarketIntegration } from "./market-integration.schema";

@Schema()
export class GameIntegration {
  @Prop({ type: mongoose.Types.ObjectId })
  operatorId: ObjectId;

  @Prop({ type: Number })
  gameId: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  mergeEvent: Record<string, any>;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  mergeEventDetails: Array<any>;

  @Prop({
    type: [
      { type: MongooseSchema.Types.ObjectId, ref: MarketIntegration.name },
    ],
  })
  markets: Array<ObjectId | MarketIntegration>;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  patches: Array<any>;
}

export type GameIntegrationDocument = GameIntegration & Document<unknown>;

export const GameIntegrationSchema =
  SchemaFactory.createForClass(GameIntegration);
