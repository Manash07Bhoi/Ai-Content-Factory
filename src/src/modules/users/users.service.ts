import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const userPayload: Partial<CreateUserDto> & { password_hash?: string } = {
      ...createUserDto,
    };
    if (userPayload.password) {
      userPayload.password_hash = await bcrypt.hash(userPayload.password, 10);
      delete userPayload.password;
    }

    const newUser = await this.usersRepository.create(userPayload);
    return new UserResponseDto(newUser);
  }

  async findAll(
    paginationDto: PaginationDto,
  ): Promise<{ data: UserResponseDto[]; meta: Record<string, unknown> }> {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 20;
    const sort = paginationDto.sort || 'created_at';
    const order = paginationDto.order || 'DESC';

    const skip = (page - 1) * limit;

    const [users, total] = await this.usersRepository.findAll(
      skip,
      limit,
      sort,
      order,
    );

    const data = users.map((user) => new UserResponseDto(user));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return new UserResponseDto(user);
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUser: { sub: string; role: string },
  ): Promise<UserResponseDto> {
    const isSelf = currentUser.sub === id;
    const isAdmin =
      currentUser.role === 'admin' || currentUser.role === 'super_admin';

    if (!isSelf && !isAdmin) {
      throw new UnauthorizedException('You can only update your own profile');
    }

    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updates: Partial<UpdateUserDto> & { password_hash?: string } = {
      ...updateUserDto,
    };

    if (updates.role && !isAdmin) {
      throw new UnauthorizedException('Only admins can change roles');
    }

    if (updates.email && updates.email !== user.email) {
      const emailTaken = await this.usersRepository.findByEmail(updates.email);
      if (emailTaken) {
        throw new ConflictException('Email is already in use');
      }
    }

    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const updatedUser = await this.usersRepository.update(id, updates);
    return new UserResponseDto(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.usersRepository.softDelete(id);
  }
}
