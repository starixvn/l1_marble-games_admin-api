import { ApiProperty } from "@nestjs/swagger";
import {
  UpdateNameArgs,
  GeneratePasswordArgs,
  GetOperatorArgs,
  OperatorCreateOptions,
} from "../operator.service";
import {
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from "class-validator";

const OPERATOR_NAME_SWAGGER_DESC = {
  description: "Operator name",
  required: false,
};

export class CreateOperatorDto implements OperatorCreateOptions {
  @ApiProperty(OPERATOR_NAME_SWAGGER_DESC)
  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateNameDto implements UpdateNameArgs {
  @ApiProperty({ description: "Operator ID string for the updated operator" })
  operatorId = "";

  @ApiProperty({ description: "New name for the updated operator" })
  @IsString()
  @IsNotEmpty({ message: "Name cannot be empty" })
  name = "";
}

export class GeneratePasswordDto implements GeneratePasswordArgs {
  @ApiProperty({ description: "Operator ID string", required: false })
  operatorId?: string;

  @ApiProperty(OPERATOR_NAME_SWAGGER_DESC)
  name?: string;
}

export class GetOperatorDto implements GetOperatorArgs {
  @ApiProperty({
    description: "Operator ID, if not specified, name must be provided",
    required: false,
  })
  @IsString()
  @IsMongoId()
  @IsOptional()
  operatorId?: string;

  @ApiProperty(OPERATOR_NAME_SWAGGER_DESC)
  @IsOptional()
  @IsString()
  name?: string;

  @ValidateIf((o) => !o.operatorId && !o.name)
  @IsNotEmpty({ message: "Either operatorId or name must be provided" })
  _atLeastOneOperatorField?: never;
}
