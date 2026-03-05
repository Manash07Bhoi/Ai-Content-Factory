import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: 'uuid-string', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ example: false })
  two_factor_enabled: boolean;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z' })
  updated_at: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
    delete (this as Partial<UserResponseDto> & { password_hash?: string })
      .password_hash;
    delete (this as Partial<UserResponseDto> & { two_factor_secret?: string })
      .two_factor_secret;
    delete (this as Partial<UserResponseDto> & { deleted_at?: Date })
      .deleted_at;
  }
}
