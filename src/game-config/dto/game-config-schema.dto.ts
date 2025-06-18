import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, IsOptional } from 'class-validator';

export class GameConfigSchemaUpsertRequestDto {
  @ApiProperty({
    type: Object,
    description: 'The game configuration schema',
  })
  @IsNotEmpty({ message: 'Schema is required' })
  @IsObject({ message: 'Schema must be an object' })
  schema: object;

  @ApiProperty({
    type: String,
    description: 'Display name for the game configuration',
  })
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @ApiProperty({
    type: Object,
    description: 'UI schema for rendering the configuration form',
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'UI schema must be an object' })
  uiSchema?: object;
}
