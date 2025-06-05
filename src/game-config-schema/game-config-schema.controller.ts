import { Body, Controller, HttpCode, HttpStatus, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";
import { GameConfigSchemaService } from "./game-config-schema.service";
import { GameConfigSchemaUpsertRequestDto } from "../game-config/dto/game-config-schema.dto";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('gameConfigSchema')
export class GameConfigSchemaController {
  constructor(
    @Inject(GameConfigSchemaService)
    private readonly gameConfigSchemaService: GameConfigSchemaService
  ) {}

  @Post('upsertSchema')
  @HttpCode(HttpStatus.OK)
  async upsertSchema(
    @Query('gameId') gameId: number, 
    @Body() body: GameConfigSchemaUpsertRequestDto) {
    return this.gameConfigSchemaService.upsertGameConfigSchema({
      gameId,
      schema: body
    });
  }
}
