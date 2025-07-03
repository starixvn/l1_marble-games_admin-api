import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AdminLogRecord,
  AdminLogRecordDocument,
  Diff,
} from './schema/admin-log-record.schema';
import { Model, RootFilterQuery } from 'mongoose';

export type AdminQueryLogParams = {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  author?: string;
  resource?: string;
  action?: string;
};

export type LogParams = {
  author: string;
  resource: string;
  action: string;
  diff?: Diff;
};

@Injectable()
export class AdminLogService {
  constructor(
    @InjectModel(AdminLogRecord.name)
    private readonly adminLogModel: Model<AdminLogRecordDocument>,
  ) {}

  async createLog(params: LogParams) {
    const { author, resource, action, diff } = params;

    const log = await this.adminLogModel.create({
      author,
      resource,
      action,
      diff,
    });

    return log;
  }

  async queryLogs(params: AdminQueryLogParams) {
    const { dateRange, author, resource, action } = params;

    const query: RootFilterQuery<AdminLogRecordDocument> = {
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate),
      },
    };

    if (author) {
      query.author = author;
    }

    if (resource) {
      query.resource = resource;
    }

    if (action) {
      query.action = action;
    }

    return this.adminLogModel
      .find(query)
      .sort({ timestamp: -1 })
      .select('-__v')
      .lean()
      .then((logs) =>
        logs.map((log) => {
          const { _id, ...rest } = log;
          return { id: _id, ...rest };
        }),
      );
  }
}
