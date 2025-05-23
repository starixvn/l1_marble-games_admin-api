import { ApiProperty } from "@nestjs/swagger";

export class GameIntegrationQueryDto {
  @ApiProperty({ 
    description: 'Operator ID string', 
    required: false,
    example: '507f1f77bcf86cd799439011'
  })
  operatorId?: string;

  @ApiProperty({ 
    description: 'Operator alias (alternative to operatorId)', 
    required: false,
    example: 'main-operator'
  })
  alias?: string;

  @ApiProperty({ 
    description: 'Game ID number',
    required: true,
    example: 1001
  })
  gameId: number;
}
