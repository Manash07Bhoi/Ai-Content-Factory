import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value as unknown;
  })
  email: string;

  @ApiPropertyOptional({
    example: 'StrongPassword123!',
    description: 'User password (optional for SSO users)',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    enum: Role,
    default: Role.CUSTOMER,
    description: 'User role',
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
