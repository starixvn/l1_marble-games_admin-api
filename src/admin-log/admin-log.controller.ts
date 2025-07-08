import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../common/decorators/role.decorator";
import { Role } from "../common/enums/role.enum";
import { AdminLogService } from "./admin-log.service";
import { AdminLogQueryDto } from "./dto/admin-log-query.dto";

@ApiBearerAuth()
@ApiTags("Admin Log")
@Controller("adminLog")
@Roles(Role.ADMIN)
export class AdminLogController {
  constructor(private readonly adminLogService: AdminLogService) {}

  @Get()
  @ApiOperation({
    summary: "Get logs",
    description: "Get logs by query",
  })
  async getLogs(@Query() query: AdminLogQueryDto) {
    return this.adminLogService.queryLogs({
      author: query.author,
      resource: query.resource,
      action: query.action,
      dateRange: {
        startDate: new Date(query.startDate),
        endDate: new Date(query.endDate),
      },
    });
  }
}
