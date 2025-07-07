import { ApiProperty } from "@nestjs/swagger";
import {
  IsOptional,
  ValidateIf,
  IsNotEmpty,
  IsDateString,
} from "class-validator";

export class AdminLogQueryDto {
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
    example: "2025-07-02T23:59:59.999",
    required: true,
  })
  endDate: string;

  @IsOptional()
  @ApiProperty({
    description: "The author of the action",
    example: "admin",
    required: false,
  })
  author?: string;

  @IsOptional()
  @ApiProperty({
    description: "game config, operator, game integration, game config schema",
    example: "resource",
    required: false,
  })
  resource?: string;

  @IsOptional()
  @ApiProperty({
    description: "insert, update, delete",
    example: "insert",
    required: false,
  })
  action?: string;

  @ValidateIf(
    (o: AdminLogQueryDto) => new Date(o.startDate) >= new Date(o.endDate),
  )
  @IsNotEmpty({ message: "Start date must be before end date" })
  _dateValid?: never;

  @ValidateIf(
    (o: AdminLogQueryDto) =>
      new Date(o.endDate).getTime() - new Date(o.startDate).getTime() >
      24 * 60 * 60 * 1000,
  )
  @IsNotEmpty({ message: "Only query logs within 24 hours are allowed" })
  _dateRangeValid?: never;
}
