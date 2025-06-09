import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
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

  @Get('get')
  @ApiQuery({ name: 'id', required: false, description: 'Game config schema ID' })
  async getSchema(
    @Query('id') id?: string,
  ) {
    if (id) {
      return this.gameConfigSchemaService.getGameConfigSchema(id);
    }
    return this.gameConfigSchemaService.getAllGameConfigSchemas();
  }

  @Post('upsert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Upsert game config schema',
    description: 'Upsert game config schema, upsert mean update if id is provided, create new if not, you can even update non existent schema with valid object id provided in the id query parameter'
  })
  @ApiQuery({ name: 'id', required: false, description: 'Game config schema ID (optional for creating new schema)' })
  async upsertSchema(
    @Body() body: GameConfigSchemaUpsertRequestDto,
    @Query('id') id?: string, 
  ) {
    return this.gameConfigSchemaService.upsertGameConfigSchema({
      id,
      schema: body.schema,
      name: body.name,
      uiSchema: body.uiSchema
    });
  }

  @Get('list')
  @ApiOperation({
    summary: 'Get all game config schemas',
    description: 'Get all game config schemas'
  })
  async listSchemas() {
    return this.gameConfigSchemaService.getAllGameConfigSchemas();
  }
}