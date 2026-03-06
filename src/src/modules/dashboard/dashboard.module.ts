import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { StatsService } from './stats.service';
import { Product } from '../products/entities/product.entity';
import { Order } from '../orders/entities/order.entity';
import { Approval } from '../approvals/entities/approval.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Order, Approval]),
  ],
  controllers: [DashboardController],
  providers: [StatsService],
  exports: [StatsService],
})
export class DashboardModule {}
