import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../common/enums/role.enum";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";

export class AuthDto {
  @ApiProperty({
    description: "The username of the user",
    example: "john.doe",
  })
  username: string;

  @ApiProperty({
    description: "The password of the user",
    example: "1234aaAA",
  })
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
  @ApiProperty({
    description: "The username of the user",
    example: "john.doe",
  })
  username: string;

  @ApiProperty({
    description: "The password of the user",
    example: "1234aaAA",
  })
  password: string;
}

export class AccountDto {
  @ApiProperty({
    description: "The username of the user",
    example: "john.doe",
  })
  username: string;

  @ApiProperty({
    description: "The type of the account",
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}

export class ProfileDto extends AccountDto {
  @ApiProperty({
    description: "The allowed endpoints of the user",
    example: ["/api/v1/users"],
  })
  allowedEndpoints: string[];
}

export class CreateAccountDto {
  @ApiProperty({
    description: "The type of the account",
    example: "george.phung",
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: "The type of the account",
    example: Role.ADMIN,
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
