import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { OperatorService, } from "./operator.service";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";
import { UpdateNameDto, ChangePasswordDto, GetOperatorDto } from "./dto/operator.dto"



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
      summary: "Update operator name",
      description: "Update the name of the operator"
    })
    @ApiBody({ type: UpdateNameDto })
    @HttpCode(200)
    @Post('updateName')
    async updateName(@Body() body: UpdateNameDto) {
      return this.operatorServcice.updateName(body);
    }

    @ApiOperation({
        summary: "Change operator password",
        description: "Change the password of the operator"
    })
    @ApiQuery({ type: ChangePasswordDto })
    @HttpCode(200)
    @Post('changePassword')
    async changePassword(@Query() query: ChangePasswordDto) {
      return this.operatorServcice.changePassword(query);
    }

    @Get('get')
    async getOperator(@Query() query: GetOperatorDto) {
      return this.operatorServcice.getOperator(query);
    }

    @Get('list')
    async getAllOperators() {
      return this.operatorServcice.getAllOperators();
    }
}
