import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { GameConfigService } from "./game-config.service";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";
import { GameConfigUpdateRequestDto, GameConfigUpsertQueryDto } from "./dto/game-config.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gameConfig')
export class GameConfigController {
  constructor(
    @Inject(GameConfigService)
    private readonly gameConfigService: GameConfigService
  ) {}

  @Post('upsert')
  @ApiOperation({
    summary: "Upsert game config",
    description: "Upsert game config, must pass schema validation"
  })
  @HttpCode(HttpStatus.OK)
  async upsertGameConfig(
    @Query() query: GameConfigUpsertQueryDto,
    @Body() body: GameConfigUpdateRequestDto) {
    return this.gameConfigService.upsertGameConfig({
      schemaId: query.schemaId,
      gameId: Number(query.gameId),
      config: body
    });
  }

  @Get('get')
  @ApiOperation({
    summary: "Get game config by gameId",
    description: "Get game config by gameId"
  })
  @HttpCode(HttpStatus.OK)
  async getGameConfig(@Query('gameId') gameId: number) {
    return this.gameConfigService.getGameConfigByGameId(Number(gameId));
  }

  @Get('list')
  @ApiOperation({
    summary: "Get all game configs",
    description: "Get all game configs"
  })
  @HttpCode(HttpStatus.OK)
  async getAllGameConfigs() {
    return this.gameConfigService.getAllGameConfigs();
  }
}
