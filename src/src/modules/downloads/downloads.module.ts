import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadsService } from './downloads.service';
import { DownloadsController } from './downloads.controller';
import { Download } from './entities/download.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Download, OrderItem]),
    StorageModule,
  ],
  controllers: [DownloadsController],
  providers: [DownloadsService],
})
export class DownloadsModule {}
