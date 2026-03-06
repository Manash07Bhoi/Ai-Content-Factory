import { Controller, Get, Post, Delete, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('Wishlists')
@Controller('wishlists')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist' })
  async getWishlist(@Req() req: RequestWithUser) {
    return this.wishlistsService.getUserWishlist(req.user.userId);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  async addProduct(@Req() req: RequestWithUser, @Param('productId') productId: string) {
    return this.wishlistsService.addProductToWishlist(req.user.userId, productId);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove product from wishlist' })
  async removeProduct(@Req() req: RequestWithUser, @Param('productId') productId: string) {
    return this.wishlistsService.removeProductFromWishlist(req.user.userId, productId);
  }
}
