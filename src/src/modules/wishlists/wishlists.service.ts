import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    private readonly productsService: ProductsService,
  ) {}

  async getUserWishlist(userId: string) {
    return this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
      order: { created_at: 'DESC' },
    });
  }

  async addProductToWishlist(userId: string, productId: string) {
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const exists = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (exists) {
      throw new ConflictException('Product already in wishlist');
    }

    const item = this.wishlistRepository.create({
      user: { id: userId },
      product: { id: productId },
    });

    return this.wishlistRepository.save(item);
  }

  async removeProductFromWishlist(userId: string, productId: string) {
    const item = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (!item) {
      throw new NotFoundException('Wishlist item not found');
    }

    await this.wishlistRepository.remove(item);
  }
}
