import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString, IsNotEmpty, IsNumber, ValidateIf } from "class-validator";
import { Transform } from "class-transformer";
import { IsMongoObjectId } from "../../common/validators/mongoid.validator";

export class GameIntegrationQueryDto {
  @ApiProperty({ 
    description: 'Operator ID string', 
    required: false,
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsString()
  @IsMongoObjectId()
  @IsNotEmpty()
  operatorId?: string;

  @ApiProperty({ 
    description: 'Operator name (alternative to operatorId)', 
    required: false,
    example: 'main-operator'
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ 
    description: 'Game ID number',
    required: true,
    example: 1001
  })
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  gameId: number;

  @ValidateIf((o) => !o.operatorId && !o.name)
  @IsNotEmpty({ message: 'Either operatorId or name must be provided' })
  _atLeastOneOperatorField?: never;
}
