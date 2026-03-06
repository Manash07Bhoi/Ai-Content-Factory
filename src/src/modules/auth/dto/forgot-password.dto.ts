import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ description: 'The registered email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
