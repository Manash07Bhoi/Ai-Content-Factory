import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { User } from '../users/entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly repository: Repository<Product>,
  ) {}

  async create(data: Partial<Product>, user: User): Promise<Product> {
    const slug = data.title ? data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uuidv4().split('-')[0] : uuidv4();
    const product = this.repository.create({ ...data, slug, created_by: user });
    return this.repository.save(product);
  }

  async findPublished(page: number, limit: number): Promise<[Product[], number]> {
    return this.repository.findAndCount({
      where: { status: ProductStatus.PUBLISHED },
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
      relations: ['created_by'],
    });
  }

  async findAllAdmin(page: number, limit: number): Promise<[Product[], number]> {
    return this.repository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
      relations: ['created_by'],
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id }, relations: ['created_by'] });
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    Object.assign(product, data);
    return this.repository.save(product);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
        throw new NotFoundException('Product not found');
    }
  }
}
