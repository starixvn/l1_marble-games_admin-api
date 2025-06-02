import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Schema()
export class MarketIntegration {

  @Prop({ type: mongoose.Schema.Types.Mixed })
  merge: Record<string, any>;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  selections: Array<any>;
}

export type MarketIntegrationDocument = MarketIntegration & mongoose.Document;

export const MarketIntegrationSchema =
  SchemaFactory.createForClass(MarketIntegration);
