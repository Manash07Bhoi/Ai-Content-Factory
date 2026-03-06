import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { StripeService } from './stripe.service';
import { ProductsService } from '../products/products.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepo: any;
  let orderItemRepo: any;
  let stripeService: jest.Mocked<StripeService>;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    orderRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), find: jest.fn() };
    orderItemRepo = { create: jest.fn(), save: jest.fn() };

    const stripeMock = { createPaymentIntent: jest.fn() };
    const productsMock = { getProductById: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: orderRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: StripeService, useValue: stripeMock },
        { provide: ProductsService, useValue: productsMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    stripeService = module.get(StripeService);
    productsService = module.get(ProductsService);
  });

  it('should create an order and payment intent', async () => {
    productsService.getProductById.mockResolvedValue({ id: 'p1', price: 10, status: 'published' } as any);
    orderRepo.create.mockReturnValue({ id: 'o1', order_number: 'ORD-TEST' });
    orderItemRepo.create.mockReturnValue({ id: 'oi1' });
    stripeService.createPaymentIntent.mockResolvedValue({ clientSecret: 'sec', paymentIntentId: 'pi' });

    const result = await service.createCheckout('u1', 'test@test.com', ['p1']);

    expect(result.clientSecret).toBe('sec');
    expect(orderRepo.save).toHaveBeenCalled();
    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(1000, 'usd', 'o1', 'test@test.com');
  });

  it('should reject checkout if product is not published', async () => {
    productsService.getProductById.mockResolvedValue({ id: 'p1', price: 10, status: 'draft' } as any);
    await expect(service.createCheckout('u1', 'test@test.com', ['p1'])).rejects.toThrow(/not available/);
  });
});
