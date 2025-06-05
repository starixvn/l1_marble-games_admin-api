import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { GameConfigService } from "./game-config.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";
import { GameConfigUpdateRequestDto } from "./dto/game-config.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gameConfig')
export class GameConfigController {
  constructor(
    @Inject(GameConfigService)
    private readonly gameConfigService: GameConfigService
  ) {}

  @Post('upsertGameConfig')
  @HttpCode(HttpStatus.OK)
  async upsertGameConfig(
    @Query('gameId') gameId: number, 
    @Body() body: GameConfigUpdateRequestDto) {
    return this.gameConfigService.upsertGameConfig(gameId, body);
  }
}
