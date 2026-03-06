import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Wishlist } from '../wishlists/entities/wishlist.entity';
import { ProductReview } from '../reviews/entities/product-review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, Wishlist, ProductReview])],
  exports: [TypeOrmModule],
})
export class MarketingModule {}
