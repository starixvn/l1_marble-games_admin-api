import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import mongoose, { ObjectId } from 'mongoose';
import { MergeSelection } from './merge-selection.schema';

@Schema()
export class MarketIntegration {
  @Prop({ type: mongoose.Types.ObjectId })
  operatorId: ObjectId;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  merge: Record<string, any>;

  @Prop({ type: [mongoose.Schema.Types.Mixed] })
  selections: Array<MergeSelection>;
}

export type MarketIntegrationDocument = MarketIntegration & mongoose.Document;

export const MarketIntegrationSchema =
  SchemaFactory.createForClass(MarketIntegration);
