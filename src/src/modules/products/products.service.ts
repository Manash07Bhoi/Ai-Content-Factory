import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { ProductsRepository } from './products.repository';
import { Product, ProductStatus, ProductType } from './entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async createProduct(data: Partial<Product>, user: User) {
    if (data.price && data.price < 0.99) {
      throw new UnprocessableEntityException('Price must be at least $0.99');
    }
    return this.productsRepository.create(data, user);
  }

  async getPublishedProducts(page: number = 1, limit: number = 20) {
    const [items, total] = await this.productsRepository.findPublished(page, limit);
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getAdminProducts(page: number = 1, limit: number = 20) {
    const [items, total] = await this.productsRepository.findAllAdmin(page, limit);
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateProduct(id: string, data: Partial<Product>) {
    if (data.price && data.price < 0.99) {
      throw new UnprocessableEntityException('Price must be at least $0.99');
    }
    return this.productsRepository.update(id, data);
  }

  async publishProduct(id: string) {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');

    // In a real app we'd also check if file_url is set before publishing.
    if (!product.file_url) {
      throw new UnprocessableEntityException('Cannot publish product without a file_url');
    }

    return this.productsRepository.update(id, { status: ProductStatus.PUBLISHED });
  }

  async archiveProduct(id: string) {
    return this.productsRepository.update(id, { status: ProductStatus.ARCHIVED });
  }

  async getProductById(id: string) {
    const product = await this.productsRepository.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }
}
