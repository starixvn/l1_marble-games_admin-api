import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
} from "@nestjs/common";
import { GameConfigService } from "./game-config.service";
import { ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import {
  GameConfigGetQueryDto,
  GameConfigUpdateRequestDto,
  GameConfigUpsertQueryDto,
} from "./dto/game-config.dto";
import { Roles } from "../common/decorators/role.decorator";
import { Role } from "../common/enums/role.enum";

@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("gameConfig")
export class GameConfigController {
  constructor(
    @Inject(GameConfigService)
    private readonly gameConfigService: GameConfigService,
  ) {}

  @Post("upsert")
  @ApiOperation({
    summary: "Upsert game config",
    description: "Upsert game config, must pass schema validation",
  })
  @HttpCode(HttpStatus.OK)
  async upsertGameConfig(
    @Query() query: GameConfigUpsertQueryDto,
    @Body() body: GameConfigUpdateRequestDto,
  ) {
    return this.gameConfigService.upsertGameConfig({
      schemaId: query.schemaId,
      gameId: Number(query.gameId),
      config: body,
    });
  }

  @Get("get")
  @ApiOperation({
    summary: "Get game config by gameId",
    description: "Get game config by gameId",
  })
  @HttpCode(HttpStatus.OK)
  async getGameConfig(@Query() query: GameConfigGetQueryDto) {
    return this.gameConfigService.getGameConfigByGameId(query.gameId);
  }

  @Get("list")
  @Roles(Role.ADMIN, Role.DEVELOPER)
  @ApiOperation({
    summary: "Get all game configs",
    description: "Get all game configs",
  })
  @HttpCode(HttpStatus.OK)
  async getAllGameConfigs() {
    return this.gameConfigService.getAllGameConfigs();
  }
}
