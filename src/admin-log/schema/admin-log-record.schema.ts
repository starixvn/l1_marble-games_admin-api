import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";

@Schema({ _id: false })
export class Diff {
  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  old?: object;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false })
  new?: object;
}

@Schema()
export class AdminLogRecord {
  @Prop({ type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ type: String, required: true })
  author: string;

  @Prop({ type: String, required: true })
  resource: string;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: Diff, required: false })
  diff?: Diff;
}

export const AdminLogRecordSchema =
  SchemaFactory.createForClass(AdminLogRecord);

export type AdminLogRecordDocument = AdminLogRecord & Document<ObjectId>;
