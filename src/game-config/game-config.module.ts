import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GameConfig, GameConfigSchema } from './schema/game-config.schema';
import { GameConfigController } from './game-config.controller';
import { GameConfigService } from './game-config.service';
import { GameConfigSchemaModule } from '../game-config-schema/game-config-schema.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: GameConfig.name,
        schema: GameConfigSchema,
        collection: 'game_configs',
      },
    ]),
    GameConfigSchemaModule,
  ],
  controllers: [GameConfigController],
  providers: [GameConfigService],
  exports: [MongooseModule],
})
export class GameConfigModule {}
