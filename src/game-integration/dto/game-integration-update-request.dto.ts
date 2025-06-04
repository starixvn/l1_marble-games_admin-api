import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsArray, IsObject, IsString } from "class-validator";

export class MarketIntegrationUpdateRequestDto {
  @ApiProperty({
    description: 'Object id of the market integration object',
    required: false,
    example: "6809fce26a798f36657e4c4d",
    type: String
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Merge configuration object',
    required: false,
    example: { "marketType": "1x2", "priority": 1 },
    type: Object
  })
  @IsOptional()
  merge?: Record<string, any>;

  @ApiProperty({
    description: 'Selection array',
    required: false,
    example: [{ "selectionID": 1, "name": "ft_hdp_home", "column": 1 }, { "selectionID": 2, "name": "ft_hdp_away", "column": 2 }],
    type: Object,
    isArray: true
  })
  @IsOptional()
  selections?: Array<any>;

  @IsOptional()
  @IsString()
  name?: string;
}

export class GameIntegrationUpdateRequestDto {
  @ApiProperty({ 
    description: 'Merge event configuration object',
    required: false,
    example: { "eventType": "match", "priority": 1 }
  })
  @IsOptional()
  @IsObject()
  mergeEvent?: Record<string, any>;

  @ApiProperty({ 
    description: 'Array of merge event details',
    required: false,
    example: [{ "detail": "live", "value": true }],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  mergeEventDetails?: Array<any>;

  @ApiProperty({ 
    description: 'Array of patches to apply',
    required: false,
    example: [{ "op": "replace", "path": "/status", "value": "active" }],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  patches?: Array<Record<string, any>>;

  @ApiProperty({ 
    description: 'Array of market integration objects',
    required: false,
    isArray: true,
    type: MarketIntegrationUpdateRequestDto
  })
  @IsOptional()
  @IsArray()
  markets?: Array<MarketIntegrationUpdateRequestDto>;
}
