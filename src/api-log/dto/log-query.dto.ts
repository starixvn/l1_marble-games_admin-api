import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  IsNumberString,
  ValidateIf,
  IsNotEmpty,
  IsDateString,
} from "class-validator";

export class ApiLogQueryDto {
  @IsDateString()
  @ApiProperty({
    description: "The start date of the log",
    example: "2025-07-02T00:00:00.000",
    required: true,
  })
  startDate: string;

  @IsDateString()
  @ApiProperty({
    description: "The end date of the log",
    example: "2025-07-02T00:12:00.000",
    required: true,
  })
  endDate: string;

  @IsOptional()
  @ApiProperty({
    description: "The operator of the log",
    example: "1234567890",
    required: false,
  })
  operator?: string;

  @IsOptional()
  @ApiProperty({
    description: "The endpoint of the log",
    example: "api/v1/logs",
    required: false,
  })
  endpoint?: string;

  @IsOptional()
  @ApiProperty({
    description: "The query params of the log",
    example: "?page=1&limit=10",
    required: false,
  })
  queryParams?: string;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: "The game id of the log",
    example: 1,
    required: false,
  })
  gameId?: number;

  @IsOptional()
  @IsNumberString()
  @ApiProperty({
    description: "The event id of the log",
    example: 1,
    required: false,
  })
  eventId?: number;

  @ValidateIf(
    (o: ApiLogQueryDto) => new Date(o.startDate) >= new Date(o.endDate),
  )
  @IsNotEmpty({ message: "Start date must be before end date" })
  _dateValid?: never;

  @ValidateIf(
    (o: ApiLogQueryDto) =>
      new Date(o.endDate).getTime() - new Date(o.startDate).getTime() >
      24 * 60 * 60 * 1000 * 7,
  )
  @IsNotEmpty({ message: "Only query logs within 7 days are allowed" })
  _dateRangeValid?: never;
}
