import { Prop, SchemaFactory } from '@nestjs/mongoose';

export class MergeSelection {
  @Prop({ type: Number })
  selectionID: number;

  @Prop({ type: Number })
  column: number;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String })
  selectionNameKey: string;

  @Prop({ type: String })
  selectionName: string;

  @Prop({ type: String })
  selectionNameLongKey: string;
}

export const MergeSelectionSchema =
  SchemaFactory.createForClass(MergeSelection);
