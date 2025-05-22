import { Controller, Post } from "@nestjs/common";
import { OperatorService } from "./operator.service";
import { ApiOperation } from "@nestjs/swagger";

@Controller('operator')
export class OperatorController {
    constructor(private readonly operatorServcice: OperatorService) {}

    @ApiOperation({
        summary: "Generate new operator credential",
        description: "Please copy the result and saved it because you wont get this credential again. And NEVER SHARE THIS TO UNAUTHORIZED ONE"
    })
    @Post('generate')
    async generateOperator() {
        const newOperator = await this.operatorServcice.createOperator();

        return newOperator;
    }
}