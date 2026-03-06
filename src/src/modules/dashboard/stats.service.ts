import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Approval, ApprovalStatus } from '../approvals/entities/approval.entity';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Approval) private readonly approvalsRepo: Repository<Approval>,
  ) {}

  async getTotals() {
    this.logger.log('Fetching dashboard totals');

    const [productsCount, ordersCount, pendingApprovalsCount, revenueResult] = await Promise.all([
      this.productsRepo.count(),
      this.ordersRepo.count({ where: { status: OrderStatus.PAID } }),
      this.approvalsRepo.count({ where: { status: ApprovalStatus.PENDING } }),
      this.ordersRepo
        .createQueryBuilder('order')
        .select('SUM(order.total_price)', 'total')
        .where('order.status = :status', { status: OrderStatus.PAID })
        .getRawOne(),
    ]);

    const totalRevenue = revenueResult?.total ? parseFloat(revenueResult.total) : 0;

    return {
      totalProducts: productsCount,
      totalOrders: ordersCount,
      pendingApprovals: pendingApprovalsCount,
      totalRevenue,
      approvedToday: 0, // Mock for now until we query by date
      ordersToday: 0 // Mock for now
    };
  }

  async getRecentActivity() {
    return {
      activities: []
    };
  }

  async getRevenueSummary() {
    return {
      revenueByPeriod: [],
      topProducts: []
    };
  }

  async getContentStats() {
    return {
      prompts: 0,
      scripts: 0,
      posters: 0,
      social: 0
    };
  }

  async getAutomationStatus() {
    return {
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      lastRunStatus: 'success',
      active: true
    };
  }

  async getReviewerStats() {
    return {
      leaderboard: []
    };
  }
}
