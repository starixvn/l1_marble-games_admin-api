import { ApiProperty } from "@nestjs/swagger";

export class GameIntegrationUpdateRequestDto {
  @ApiProperty({ 
    description: 'Merge event configuration object',
    required: false,
    example: { "eventType": "match", "priority": 1 }
  })
  mergeEvent: Record<string, any> = {};

  @ApiProperty({ 
    description: 'Array of merge event details',
    required: false,
    example: [{ "detail": "live", "value": true }],
    isArray: true
  })
  mergeEventDetails: Array<any> = [];

  @ApiProperty({ 
    description: 'Array of patches to apply',
    required: false,
    example: [{ "op": "replace", "path": "/status", "value": "active" }],
    isArray: true
  })
  patches: Array<any> = [];

  @ApiProperty({ 
    description: 'Array of market strings',
    required: false,
    example: ["1X2", "Over/Under", "Both Teams to Score"],
    isArray: true,
    type: String
  })
  markets: Array<string> = [];
}
