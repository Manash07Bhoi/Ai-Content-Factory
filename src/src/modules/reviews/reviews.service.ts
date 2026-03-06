import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductReview } from './entities/product-review.entity';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(ProductReview)
    private readonly reviewRepository: Repository<ProductReview>,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  async getProductReviews(productId: string) {
    return this.reviewRepository.find({
      where: { product: { id: productId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async addReview(userId: string, productId: string, rating: number, comment?: string) {
    const product = await this.productsService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify user purchased the product
    const hasPurchased = await this.ordersService.hasUserPurchasedProduct(userId, productId);
    if (!hasPurchased) {
      throw new ForbiddenException('You can only review products you have purchased.');
    }

    const existingReview = await this.reviewRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this product.');
    }

    const review = this.reviewRepository.create({
      user: { id: userId },
      product: { id: productId },
      rating,
      comment,
    });

    return this.reviewRepository.save(review);
  }
}
