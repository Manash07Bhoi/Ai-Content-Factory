import { Controller, Post, Body, Req, Headers, UseGuards, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

export class CheckoutDto {
  productIds: string[];
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN)
  async checkout(@Body() dto: CheckoutDto, @CurrentUser() user: any) {
    return this.ordersService.createCheckout(user.sub, user.email, dto.productIds);
  }

  @Public()
  @Post('webhook')
  async handleWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    let event;

    try {
      // req.rawBody is required by Stripe constructEvent to verify signature
      // Usually achieved using a middleware or a body parser config in main.ts
      // Assuming req.body contains raw buffer for this implementation.
      event = this.stripeService.constructEvent(req.body, signature);
    } catch (err) {
      return { status: 400, message: `Webhook Error: ${err.message}` };
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as any;
      await this.ordersService.markAsPaid(paymentIntent.id, paymentIntent.latest_charge || undefined);
    }

    return { received: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles(Role.CUSTOMER, Role.REVIEWER, Role.ADMIN, Role.SUPER_ADMIN)
  async getMyOrders(@CurrentUser() user: any) {
    return this.ordersService.getMyOrders(user.sub);
  }
}
