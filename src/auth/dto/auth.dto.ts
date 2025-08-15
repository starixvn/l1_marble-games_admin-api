import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../common/enums/role.enum";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

const PASSWORD_SWAGGER_DESC = {
  description: "The password of the user",
  example: "1234aaAA",
  format: "password",
};

const USERNAME_SWAGGER_DESC = {
  description: "The username of the user",
  example: "john.doe",
};

const ROLE_SWAGGER_DESC = {
  description: "The role of the user",
  example: Role.ADMIN,
};

const ALLOWED_ENDPOINTS_SWAGGER_DESC = {
  description: "The allowed endpoints of the user",
  example: ["/api/v1/users"],
};

export class AuthDto {
  @ApiProperty(USERNAME_SWAGGER_DESC)
  username: string;

  @ApiProperty(PASSWORD_SWAGGER_DESC)
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: "JWT access token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  access_token: string;
}

export class AccountResponseDto {
  @ApiProperty(USERNAME_SWAGGER_DESC)
  username: string;

  @ApiProperty(PASSWORD_SWAGGER_DESC)
  password: string;
}

export class AccountDto {
  @ApiProperty(USERNAME_SWAGGER_DESC)
  username: string;

  @ApiProperty(ROLE_SWAGGER_DESC)
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class ProfileDto extends AccountDto {
  @ApiProperty(ALLOWED_ENDPOINTS_SWAGGER_DESC)
  allowedEndpoints: string[];
}

export class CreateAccountDto {
  @ApiProperty(USERNAME_SWAGGER_DESC)
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty(ROLE_SWAGGER_DESC)
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
