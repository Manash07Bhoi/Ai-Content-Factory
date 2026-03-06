import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { StripeService } from './stripe.service';
import { ProductsService } from '../products/products.service';
import { randomUUID } from 'crypto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    private readonly stripeService: StripeService,
    private readonly productsService: ProductsService,
  ) {}

  async createCheckout(userId: string, userEmail: string, productIds: string[]) {
    if (!productIds || productIds.length === 0) {
      throw new Error('At least one product is required for checkout');
    }

    let totalPrice = 0;
    const productsToPurchase = [];

    // Validate products exist and sum prices
    for (const pid of productIds) {
      const product = await this.productsService.getProductById(pid);
      if (product.status !== 'published') {
          throw new Error(`Product ${product.title} is not available for purchase.`);
      }
      totalPrice += Number(product.price);
      productsToPurchase.push(product);
    }

    // Create Order Record
    const orderNumber = `ORD-${new Date().getFullYear()}-${randomUUID().split('-')[0].toUpperCase()}`;
    const order = this.orderRepository.create({
      user: { id: userId } as User,
      order_number: orderNumber,
      total_price: totalPrice,
      currency: 'USD',
      status: OrderStatus.PENDING,
    });

    await this.orderRepository.save(order);

    // Create Order Items
    for (const product of productsToPurchase) {
      const item = this.orderItemRepository.create({
        order,
        product,
        unit_price: product.price,
        quantity: 1,
        product_snapshot: product,
      });
      await this.orderItemRepository.save(item);
    }

    // Generate Payment Intent
    const amountCents = Math.round(totalPrice * 100);
    const paymentData = await this.stripeService.createPaymentIntent(amountCents, 'usd', order.id, userEmail);

    // Update order with Payment Intent ID
    order.stripe_payment_intent_id = paymentData.paymentIntentId;
    await this.orderRepository.save(order);

    return {
      clientSecret: paymentData.clientSecret,
      orderId: order.id,
      orderNumber: order.order_number,
    };
  }

  async hasUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const count = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .where('order.user_id = :userId', { userId })
      .andWhere('item.product_id = :productId', { productId })
      .andWhere('order.status = :status', { status: OrderStatus.PAID })
      .getCount();

    return count > 0;
  }

  async markAsPaid(paymentIntentId: string, chargeId?: string) {
    const order = await this.orderRepository.findOne({ where: { stripe_payment_intent_id: paymentIntentId }});
    if (!order) {
      throw new NotFoundException(`Order with payment intent ${paymentIntentId} not found`);
    }

    order.status = OrderStatus.PAID;
    order.paid_at = new Date();
    order.stripe_charge_id = chargeId;

    await this.orderRepository.save(order);
    return order;
  }

  async getMyOrders(userId: string) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      order: { created_at: 'DESC' },
    });
  }

  async getAllOrders() {
    return this.orderRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async refundOrder(orderId: string) {
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException(`Order is not in paid status, cannot refund. Current status: ${order.status}`);
    }

    // Mock implementation for stripe refund
    order.status = OrderStatus.REFUNDED;
    await this.orderRepository.save(order);

    return {
      message: 'Order successfully refunded',
      order,
    };
  }
}