import { Module } from "@nestjs/common";
import { OperatorController } from "./operator.controller";
import { OperatorService } from "./operator.service";
import {
  OperatorCredential,
  OperatorSchema,
} from "./schema/operator-credential.schema";
import { MongooseModule } from "@nestjs/mongoose";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: OperatorCredential.name,
        schema: OperatorSchema,
        collection: "operators",
      },
    ]),
  ],
  controllers: [OperatorController],
  providers: [OperatorService],
  exports: [MongooseModule],
})
export class OperatorModule {}
