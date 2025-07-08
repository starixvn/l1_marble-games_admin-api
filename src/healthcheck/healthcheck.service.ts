import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";

const MONGO_READY_STATE_TEXT = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

@Injectable()
export class HealthcheckService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  async healthCheck() {
    try {
      if (this.mongoConnection.readyState !== 1) {
        throw new ServiceUnavailableException({
          message: `API is running but database is unavailable, ${process.env.ENVIRONMENT} environment`,
          timestamp: new Date().toISOString(),
          database: {
            error: "DB not ready",
            state: this.getReadyStateText(this.mongoConnection.readyState),
          },
        });
      }

      return {
        messge: `API is running in ${process.env.ENVIRONMENT} environment`,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        message: `API is running but database is unavailable, ${process.env.ENVIRONMENT} environment`,
        timestamp: new Date().toISOString(),
        database: {
          error: "DB not ready",
          state: this.getReadyStateText(this.mongoConnection.readyState),
        },
      });
    }
  }

  private getReadyStateText(state: number): string {
    return MONGO_READY_STATE_TEXT[state] ?? "unknown";
  }
}
