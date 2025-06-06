import { ApiProperty } from '@nestjs/swagger';

export class GameConfigSchemaUpsertRequestDto {
  @ApiProperty({
    type: Object,
    description: 'The game configuration schema',
  })
  schema: object;

  @ApiProperty({
    type: String,
    description: 'Display name for the game configuration',
  })
  displayName: string;

  @ApiProperty({
    type: Object,
    description: 'UI schema for rendering the configuration form',
  })
  uiSchema: object;
}