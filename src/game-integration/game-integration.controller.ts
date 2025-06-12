import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { GameIntegrationService } from "./game-integration.service";
import { GameIntegrationQueryDto } from "./dto/game-integration-query.dto";
import { GameIntegrationUpdateRequestDto } from "./dto/game-integration-update-request.dto";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";

@ApiTags('Game Integration')
@Controller('gameIntegration')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GameIntegrationController {

  constructor(private readonly gameIntegrationService: GameIntegrationService) {}

  @Post('upsert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or update game integration',
    description: 'Creates a new game integration or updates an existing one based on operatorId/alias and gameId. This endpoint allows you to configure game-specific settings for operators.'
  })
  @ApiResponse({
    status: 200,
    description: 'Game integration successfully created or updated'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Missing required parameters (operatorId/alias and gameId)'
  })
  @ApiResponse({
    status: 404,
    description: 'Operator not found'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Update operation failed'
  })
  async upsertGameIntegration(
    @Query()
    query: GameIntegrationQueryDto,
    @Body()
    updateRequest: GameIntegrationUpdateRequestDto
  ) {
    return this.gameIntegrationService.upsertGameIntegration(query, updateRequest);
  }

  @Get('get')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get game integration',
    description: 'Retrieves game integration details based on operatorId/alias and gameId'
  })
  @ApiResponse({
    status: 200,
    description: 'Game integration successfully retrieved'
  })
  @ApiResponse({
    status: 404,
    description: 'Game integration not found'
  })
  async getGameIntegration(
    @Query()
    query: GameIntegrationQueryDto
  ) {
    return this.gameIntegrationService.getGameIntegration(query);
  }
}