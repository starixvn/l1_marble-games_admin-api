import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';

export type LogRecordDocument = LogRecord & Document<ObjectId>;

@Schema()
export class LogRecord {
  @Prop({ type: mongoose.Schema.Types.Mixed })
  request: object;
  @Prop({ type: mongoose.Schema.Types.Mixed })
  response: object;
  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  user?: object;

  @Prop({ type: Date, default: Date.now })
  timestamp?: Date;
}

export const LogRecordSchema = SchemaFactory.createForClass(LogRecord);
