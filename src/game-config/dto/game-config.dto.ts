import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId, IsNumberString, IsOptional, IsString } from "class-validator";

export class GameConfigUpdateRequestDto {
  [key: string]: any;
}

export class GameConfigUpsertQueryDto {
  @IsNumberString()
  @ApiProperty({
    description: "The id of the game to update the config for",
    required: true
  })
  gameId: number;

  @IsString()
  @IsMongoId()
  @IsOptional()
  @ApiProperty({
    description: "The id of the schema to use for the game config",
    required: false
  })
  schemaId?: string;
}

export class GameConfigGetQueryDto {
  @IsNumberString()
  @ApiProperty({
    description: "The id of the game to get the config for",
    required: true
  })
  gameId: number;
}