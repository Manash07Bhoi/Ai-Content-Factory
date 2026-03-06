import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { Approval } from '../approvals/entities/approval.entity';

describe('StatsService', () => {
  let service: StatsService;

  const mockProductsRepo = {
    count: jest.fn().mockResolvedValue(10),
  };
  const mockOrdersRepo = {
    count: jest.fn().mockResolvedValue(5),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: '150.50' }),
    })),
  };
  const mockApprovalsRepo = {
    count: jest.fn().mockResolvedValue(2),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: getRepositoryToken(Product), useValue: mockProductsRepo },
        { provide: getRepositoryToken(Order), useValue: mockOrdersRepo },
        { provide: getRepositoryToken(Approval), useValue: mockApprovalsRepo },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return totals', async () => {
    const totals = await service.getTotals();
    expect(totals).toBeDefined();
    expect(totals.totalProducts).toEqual(10);
    expect(totals.totalOrders).toEqual(5);
    expect(totals.pendingApprovals).toEqual(2);
    expect(totals.totalRevenue).toEqual(150.5);
  });
});
