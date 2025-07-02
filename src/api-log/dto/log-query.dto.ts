import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsNumberString,
  ValidateIf,
  IsNotEmpty,
} from 'class-validator';

export class ApiLogQueryDto {
  @IsDate()
  @ApiProperty({
    description: 'The start date of the log',
    example: '2025-07-02T00:00:00.000',
    required: true,
  })
  @Transform(({ value }: { value: string }) => new Date(value))
  startDate: Date;

  @IsDate()
  @Transform(({ value }: { value: string }) => new Date(value))
  @ApiProperty({
    description: 'The end date of the log',
    example: '2025-07-02T00:12:00.000',
    required: true,
  })
  @Transform(({ value }: { value: string }) => new Date(value))
  endDate: Date;

  @IsOptional()
  @ApiProperty({
    description: 'The operator of the log',
    example: '1234567890',
    required: false,
  })
  operator?: string;

  @IsOptional()
  @ApiProperty({
    description: 'The endpoint of the log',
    example: 'api/v1/logs',
    required: false,
  })
  endpoint?: string;

  @IsOptional()
  @ApiProperty({
    description: 'The query params of the log',
    example: '?page=1&limit=10',
    required: false,
  })
  queryParams?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'The game id of the log',
    example: 1,
    required: false,
  })
  gameId?: number;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: 'The event id of the log',
    example: 1,
    required: false,
  })
  eventId?: number;

  @ValidateIf((o: ApiLogQueryDto) => o.startDate >= o.endDate)
  @IsNotEmpty({ message: 'Start date must be before end date' })
  _dateValid?: never;

  @ValidateIf(
    (o: ApiLogQueryDto) =>
      o.endDate.getTime() - o.startDate.getTime() > 24 * 60 * 60 * 1000,
  )
  @IsNotEmpty({ message: 'Only query logs within 24 hours are allowed' })
  _dateRangeValid?: never;
}
