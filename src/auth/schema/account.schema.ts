import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId } from "mongoose";

export type AccountDocument = Account & Document<ObjectId>;

@Schema()
export class Account {

    @Prop({ type: String, required: false })
    username: string;

    @Prop({ type: String })
    password: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
