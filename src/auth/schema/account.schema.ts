import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId } from "mongoose";
import { Role } from "../../common/enums/role.enum";

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
