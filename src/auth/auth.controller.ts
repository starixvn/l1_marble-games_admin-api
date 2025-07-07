import {
  Controller,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Get,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  AuthDto,
  AuthResponseDto,
  AccountResponseDto,
  CreateAccountDto,
  AccountDto,
  ProfileDto,
} from "./dto/auth.dto";
import { Public } from "../common/decorators/public.decorator";
import { Role } from "../common/enums/role.enum";
import { Roles } from "../common/decorators/role.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Login with username and password" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized: Invalid credentials",
  })
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthDto): Promise<AuthResponseDto> {
    const account = await this.authService.validateAccount({
      username: loginDto.username,
      password: loginDto.password,
    });

    if (!account) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = await this.authService.generateJwt({
      id: account.id,
      role: account.role,
    });

    return {
      access_token: token,
    };
  }

  @Post("oneTimeRegister")
  @HttpCode(HttpStatus.OK)
  @Public()
  async oneTimeRegister(): Promise<AccountResponseDto> {
    return this.authService.oneTimeRegister();
  }

  @ApiBearerAuth()
  @Post("changePassword")
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: { user: { id: string } },
  ): Promise<AccountResponseDto> {
    const userId = req.user.id;
    return this.authService.changePassword(userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post("createAccount")
  @HttpCode(HttpStatus.OK)
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
  ): Promise<AccountResponseDto> {
    return this.authService.createAccount(createAccountDto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get("getAllAccounts")
  @HttpCode(HttpStatus.OK)
  async getAllAccounts(): Promise<AccountDto[]> {
    return this.authService.getAllAccounts();
  }

  @ApiBearerAuth()
  @Get("profile")
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Request() req: { user: { id: string } },
  ): Promise<ProfileDto> {
    return this.authService.getProfile(req.user.id);
  }
}
