import { Body, Controller, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { ChangePasswordArgs, OperatorService, UpdateAliasArgs } from "./operator.service";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";

class UpdateAliasDto implements UpdateAliasArgs {
  @ApiProperty({ description: 'Operator ID string' })
  operatorId: string = '';
  
  @ApiProperty({ description: 'New alias for the operator' })
  alias: string = '';
}

class ChangePasswordDto implements ChangePasswordArgs {
  @ApiProperty({ description: 'Operator ID string', required: false })
  operatorId?: string;
  
  @ApiProperty({ description: 'Operator alias', required: false })
  alias?: string;
}

@Controller('operator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OperatorController {
    constructor(private readonly operatorServcice: OperatorService) {}

    @ApiOperation({
        summary: "Generate new operator credential",
        description: "Please copy the result and saved it because you wont get this credential again. And NEVER SHARE THIS TO UNAUTHORIZED ONE"
    })
    @HttpCode(200)
    @Post('generate')
    async generateOperator() {
        return await this.operatorServcice.createOperator();
    }

    @ApiOperation({
        summary: "Update operator alias",
        description: "Update the alias of the operator"
    })
    @ApiBody({ type: UpdateAliasDto })
    @HttpCode(200)
    @Post('updateAlias')
    async updateAlias(@Body() body: UpdateAliasArgs) {
        return this.operatorServcice.updateAlias(body);
    }

    @ApiOperation({
        summary: "Change operator password",
        description: "Change the password of the operator"
    })
    @ApiQuery({ type: ChangePasswordDto })
    @HttpCode(200)
    @Post('changePassword')
    async changePassword(@Query() query: ChangePasswordArgs) {
        return this.operatorServcice.changePassword(query);
    }
}