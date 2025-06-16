import { ApiProperty } from "@nestjs/swagger";
import { UpdateNameArgs, GeneratePasswordArgs, GetOperatorArgs, OperatorCreateOptions } from "../operator.service";
import { IsNotEmpty, IsOptional, IsString, ValidateIf } from "class-validator";
import { IsMongoObjectId } from "../../common/validators/mongoid.validator";

export class CreateOperatorDto implements OperatorCreateOptions {
  @ApiProperty({ description: 'Operator name', required: false, example: 'JohnDoe' })
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateNameDto implements UpdateNameArgs {
  @ApiProperty({ description: 'Operator ID string' })
  operatorId: string = '';
  
  @ApiProperty({ description: 'New name for the operator' })
  name: string = '';
}

export class GeneratePasswordDto implements GeneratePasswordArgs {
  @ApiProperty({ description: 'Operator ID string', required: false })
  operatorId?: string;
  
  @ApiProperty({ description: 'Operator name', required: false })
  name?: string;
}

export class GetOperatorDto implements GetOperatorArgs {
  @ApiProperty({ description: 'Operator ID string', required: false })
  @IsString()
  @IsMongoObjectId()
  @IsOptional()
  operatorId?: string;
  
  @ApiProperty({ description: 'Operator name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ValidateIf((o) => !o.operatorId && !o.name)
  @IsNotEmpty({ message: 'Either operatorId or name must be provided' })
  _atLeastOneOperatorField?: never;
}
