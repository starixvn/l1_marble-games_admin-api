import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from "@nestjs/common";
import { OperatorService, } from "./operator.service";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/guards/jwt.auth.guard";
import { UpdateNameDto, GeneratePasswordDto, GetOperatorDto } from "./dto/operator.dto"



@Controller('operator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OperatorController {
    constructor(private readonly operatorServcice: OperatorService) {}

    @ApiOperation({
      summary: "Create new operator credential",
      description: "Please copy the result and saved it because you wont get this credential again. And NEVER SHARE THIS TO UNAUTHORIZED ONE"
    })
    @HttpCode(200)
    @Post('create')
    async createOperator() {
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
        summary: "Generate new operator password",
        description: "Generate the new password of the operator"
    })
    @ApiQuery({ type: GeneratePasswordDto })
    @HttpCode(200)
    @Post('generatePassword')
    async generatePassword(@Query() query: GeneratePasswordDto) {
      return this.operatorServcice.generatePassword(query);
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
