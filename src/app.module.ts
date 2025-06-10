import { Module } from '@nestjs/common';
import { OperatorModule } from './operator/operator.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { GameIntegrationModule } from './game-integration/game-integration.module';
import { AuthModule } from './auth/auth.module';
import { GameConfigModule } from './game-config/game-config.module';
import { GameConfigSchemaModule } from './game-config-schema/game-config-schema.module';

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
    AuthModule,
    OperatorModule,
    GameIntegrationModule,
    GameConfigSchemaModule,
    GameConfigModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
