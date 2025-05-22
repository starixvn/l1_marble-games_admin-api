import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ 
    status: 200, 
    description: 'API is working properly' 
  })
  healthCheck() {
    const environment = process.env.ENVIRONMENT ?? 'UNKNOWN';
    
    return {
      status: 'ok',
      message: `API is running, ${environment} environment`,
      timestamp: new Date().toISOString()
    };
  }
} 
