import { ApiProperty } from "@nestjs/swagger";
import { IsMongoId } from "class-validator";

export class GameConfigSchemaQueryDto {
  @IsMongoId()
  @ApiProperty({
    description: "The id of the schema to use for the game config",
    required: true
  })
  id: string;
}