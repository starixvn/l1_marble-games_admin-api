import { Module } from "@nestjs/common";
import { ApiLogController } from "./api-log.controller";
import { ApiLogQueryService } from "./api-log.service";
import { MongooseModule } from "@nestjs/mongoose";
import { LogRecord, LogRecordSchema } from "./schema/log-record.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: LogRecord.name,
        schema: LogRecordSchema,
        collection: "log_records",
      },
    ]),
  ],
  controllers: [ApiLogController],
  providers: [ApiLogQueryService],
})
export class ApiLogModule {}
