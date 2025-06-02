import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'john.doe',
  })
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    example: '1234aaAA',
  })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;
}

export class AccountResponseDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'john.doe',
  })
  username: string;

  @ApiProperty({
    description: 'The password of the user',
    example: '1234aaAA',
  })
  password: string;  
}