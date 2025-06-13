import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId } from "mongoose";

export enum Role {
    ADMIN = "admin",
    DEVELOPER = "developer",
}

const roleValues = Object.values(Role);

export type AccountDocument = Account & Document<ObjectId>;

@Schema()
export class Account {

    @Prop({ type: String, required: false })
    username: string;

    @Prop({ type: String })
    password: string;

    @Prop({ type: String, enum: roleValues, required: true })
    role: Role;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
