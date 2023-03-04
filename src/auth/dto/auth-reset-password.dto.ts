import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class AuthResetPasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  hash: string;
}
