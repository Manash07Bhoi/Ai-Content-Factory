import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.repository.create(user);
    return this.repository.save(newUser);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(
    skip: number,
    take: number,
    sort: string,
    order: 'ASC' | 'DESC',
  ): Promise<[User[], number]> {
    return this.repository.findAndCount({
      skip,
      take,
      order: { [sort]: order },
    });
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    await this.repository.update(id, updates);
    return this.repository.findOne({ where: { id } }) as Promise<User>;
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
