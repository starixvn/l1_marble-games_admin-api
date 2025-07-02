import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiLogQueryService } from './api-log.service';
import { Roles } from '../common/decorators/role.decorator';
import { Role } from '../common/enums/role.enum';
import { ApiLogQueryDto } from './dto/log-query.dto';

@ApiBearerAuth()
@ApiTags('API Log')
@Controller('apiLog')
@Roles(Role.ADMIN)
export class ApiLogController {
  constructor(private readonly apiLogService: ApiLogQueryService) {}

  @Get()
  @ApiOperation({
    summary: 'Get logs',
    description: 'Get logs by query',
  })
  async getLogs(@Query() query: ApiLogQueryDto) {
    return this.apiLogService.queryLogs({
      operator: query.operator,
      endpoint: query.endpoint,
      queryParams: query.queryParams,
      dateRange: {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      },
      gameId: query.gameId,
      eventId: query.eventId,
    });
  }
}
