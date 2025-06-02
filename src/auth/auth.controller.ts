import {
  Controller,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDto, AuthResponseDto, AccountResponseDto } from './dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt.auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with username and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Invalid credentials',
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: AuthDto): Promise<AuthResponseDto> {
    const accountId = await this.authService.validateAccount({
      username: loginDto.username,
      password: loginDto.password,
    });

    if (!accountId) {
      throw new UnauthorizedException('Invalid credentials');
    }


    const token = await this.authService.generateJwt({
      id: accountId,
    });

    return {
      access_token: token,
    };
  }

  @Post('oneTimeRegister')
  @HttpCode(HttpStatus.OK)
  async oneTimeRegister(): Promise<AccountResponseDto> {
    return this.authService.oneTimeRegister();
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('changePassword')
  @HttpCode(HttpStatus.OK)
  async changePassword(): Promise<AccountResponseDto> {
    return this.authService.changePassword();
  }
}
