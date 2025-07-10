import { Module } from "@nestjs/common";
import { OperatorModule } from "./operator/operator.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration from "./config/configuration";
import { MongooseModule } from "@nestjs/mongoose";
import { GameIntegrationModule } from "./game-integration/game-integration.module";
import { AuthModule } from "./auth/auth.module";
import { GameConfigModule } from "./game-config/game-config.module";
import { GameConfigSchemaModule } from "./game-config-schema/game-config-schema.module";
import { RolesGuard } from "./common/guards/role.guard";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { JwtAuthGuard } from "./common/guards/jwt.auth.guard";
import { HealthcheckModule } from "./healthcheck/healthcheck.module";
import { ApiLogModule } from "./api-log/api-log.module";
import { AdminLogModule } from "./admin-log/admin-log.module";
import { ClsModule } from "nestjs-cls";
import { UserInterceptor } from "./common/interceptors/user.interceptor";

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get("database");

        return {
          ...dbConfig,
        };
      },
    }),
    HealthcheckModule,
    AuthModule,
    OperatorModule,
    GameIntegrationModule,
    GameConfigModule,
    GameConfigSchemaModule,
    ApiLogModule,
    AdminLogModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserInterceptor,
    },
  ],
})
export class AppModule {}
