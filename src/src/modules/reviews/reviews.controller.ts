import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':productId')
  @ApiOperation({ summary: 'Get reviews for a product' })
  async getProductReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @Post(':productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review to a product' })
  async addReview(
    @Req() req: RequestWithUser,
    @Param('productId') productId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.addReview(req.user.userId, productId, createReviewDto.rating, createReviewDto.comment);
  }
}
