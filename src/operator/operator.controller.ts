import { Body, Controller, Post, Query } from "@nestjs/common";
import { ChangePasswordArgs, OperatorService, UpdateAliasArgs } from "./operator.service";
import { ApiBody, ApiOperation, ApiProperty, ApiQuery } from "@nestjs/swagger";

class UpdateAliasDto implements UpdateAliasArgs {
  @ApiProperty({ description: 'Operator ID string' })
  operatorId: string;
  
  @ApiProperty({ description: 'New alias for the operator' })
  alias: string;
}

class ChangePasswordDto implements ChangePasswordArgs {
  @ApiProperty({ description: 'Operator ID string', required: false })
  operatorId?: string;
  
  @ApiProperty({ description: 'Operator alias', required: false })
  alias?: string;
}

@Controller('operator')
export class OperatorController {
    constructor(private readonly operatorServcice: OperatorService) {}

    @ApiOperation({
        summary: "Generate new operator credential",
        description: "Please copy the result and saved it because you wont get this credential again. And NEVER SHARE THIS TO UNAUTHORIZED ONE"
    })
    @Post('generate')
    async generateOperator() {
        return await this.operatorServcice.createOperator();
    }

    @ApiOperation({
        summary: "Update operator alias",
        description: "Update the alias of the operator"
    })
    @ApiBody({ type: UpdateAliasDto })
    @Post('updateAlias')
    async updateAlias(@Body() body: UpdateAliasArgs) {
        return this.operatorServcice.updateAlias(body);
    }

    @ApiOperation({
        summary: "Change operator password",
        description: "Change the password of the operator"
    })
    @ApiQuery({ type: ChangePasswordDto })
    @Post('changePassword')
    async changePassword(@Query() query: ChangePasswordArgs) {
        return this.operatorServcice.changePassword(query);
    }
}