import { Module } from '@nestjs/common';
import { OperatorModule } from './operator/operator.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { GameIntegrationModule } from './game-integration/game-integration.module';
import { AuthModule } from './auth/auth.module';
import { GameConfigModule } from './game-config/game-config.module';
import { GameConfigSchemaModule } from './game-config-schema/game-config-schema.module';
import { RolesGuard } from './common/guards/role.guard';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt.auth.guard';
import { HealthcheckModule } from './healthcheck/healthcheck.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const dbConfig = configService.get('database');

        return {
          ...dbConfig
        };
      }
    }),
    HealthcheckModule,
    AuthModule,
    OperatorModule,
    GameIntegrationModule,
    GameConfigModule,
    GameConfigSchemaModule,
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
  ],
})
export class AppModule {}
