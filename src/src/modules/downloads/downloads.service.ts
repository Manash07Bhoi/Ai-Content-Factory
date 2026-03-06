import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Download } from './entities/download.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { StorageService } from '../storage/storage.service';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class DownloadsService {
  constructor(
    @InjectRepository(Download) private readonly downloadRepository: Repository<Download>,
    @InjectRepository(OrderItem) private readonly orderItemRepository: Repository<OrderItem>,
    private readonly storageService: StorageService,
  ) {}

  async generateSignedUrl(productId: string, userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    // Verify purchase
    const orderItem = await this.orderItemRepository.findOne({
      where: {
        product: { id: productId },
        order: { user: { id: userId }, status: OrderStatus.PAID },
      },
      relations: ['order', 'product'],
      order: { order: { created_at: 'DESC' } }, // Get most recent purchase if multiple
    });

    if (!orderItem) {
      throw new ForbiddenException('You must purchase this product to download it.');
    }

    const { order, product } = orderItem;

    if (!product.file_url) {
      throw new NotFoundException('Product file is missing.');
    }

    // Check download limits
    let downloadRecord = await this.downloadRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
        order: { id: order.id },
      },
    });

    if (downloadRecord) {
      if (downloadRecord.download_count >= 5) {
        throw new ForbiddenException('Maximum download limit (5) reached for this purchase. Please repurchase.');
      }
      downloadRecord.download_count += 1;
      downloadRecord.last_downloaded_at = new Date();
      downloadRecord.ip_address = ipAddress;
      downloadRecord.user_agent = userAgent;
    } else {
      downloadRecord = this.downloadRepository.create({
        user: { id: userId } as User,
        product: { id: productId } as Product,
        order: { id: order.id } as Order,
        download_count: 1,
        ip_address: ipAddress,
        user_agent: userAgent,
        last_downloaded_at: new Date(),
      });
    }

    await this.downloadRepository.save(downloadRecord);

    // Generate 15-minute signed URL
    return this.storageService.generateSignedUrl(product.file_url, 900);
  }

  async getHistory(userId: string) {
    return this.downloadRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'order'],
      order: { last_downloaded_at: 'DESC' },
    });
  }

  async getAllDownloads() {
    return this.downloadRepository.find({
      relations: ['product', 'order', 'user'],
      order: { last_downloaded_at: 'DESC' },
    });
  }
}
