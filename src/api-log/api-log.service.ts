import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { LogRecord, LogRecordDocument } from "./schema/log-record.schema";
import { Model, RootFilterQuery } from "mongoose";

export type QueryLogsParams = {
  operator?: string;
  endpoint?: string;
  queryParams?: string;
  gameId?: number;
  eventId?: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
};

@Injectable()
export class ApiLogQueryService {
  constructor(
    @InjectModel(LogRecord.name)
    private readonly logModel: Model<LogRecordDocument>,
  ) {}

  async queryLogs(params: QueryLogsParams) {
    const { operator, endpoint, queryParams, dateRange, gameId, eventId } =
      params;

    const query: RootFilterQuery<LogRecordDocument> = {
      timestamp: {
        $gte: new Date(dateRange.startDate),
        $lte: new Date(dateRange.endDate),
      },
    };

    if (operator) {
      query["user.userId"] = operator;
    }

    if (endpoint) {
      query["request.path"] = endpoint;
    }

    if (queryParams) {
      query["request.query"] = Object.fromEntries(
        new URLSearchParams(queryParams),
      );
    }

    if (gameId) {
      query["request.additionalInfo.gameId"] = gameId;
    }

    if (eventId) {
      query["request.additionalInfo.eventId"] = eventId;
    }

    return this.logModel
      .find(query)
      .sort({ timestamp: -1 })
      .lean()
      .then((logs) =>
        logs.map((log) => {
          const { _id, ...rest } = log;
          return { id: _id, ...rest };
        }),
      );
  }
}
