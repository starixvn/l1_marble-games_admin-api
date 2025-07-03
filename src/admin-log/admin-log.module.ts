import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminLogRecord,
  AdminLogRecordSchema,
} from './schema/admin-log-record.schema';
import { AdminLogService } from './admin-log.service';
import { AdminLogController } from './admin-log.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AdminLogRecord.name,
        schema: AdminLogRecordSchema,
        collection: 'admin_log_records',
      },
    ]),
  ],
  providers: [AdminLogService],
  exports: [AdminLogService],
  controllers: [AdminLogController],
})
export class AdminLogModule {}
