import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthcheckService } from './healthcheck.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller()
export class HealthcheckController {
  constructor(
    @Inject(HealthcheckService)
    private readonly healthcheckService: HealthcheckService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API is working properly' 
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable - Database connection failed'
  })
  async healthCheck() {
    return this.healthcheckService.healthCheck();
  }

} 
