import { Module } from '@nestjs/common';
import { OperatorModule } from './operator/operator.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';

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
    OperatorModule
  ],
  controllers: [AppController],
})
export class AppModule {}
