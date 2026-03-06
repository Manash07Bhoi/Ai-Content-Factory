import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProductBuilderService } from './product-builder.service';
import { ProductBuilderController } from './product-builder.controller';
import { ProductBuilderProcessor } from './product-builder.processor';
import { ProductsModule } from '../products/products.module';
import { StorageModule } from '../storage/storage.module';
import { UsersModule } from '../users/users.module';
import { QUEUES } from '../../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.PRODUCT_BUILDER,
    }),
    ProductsModule,
    StorageModule,
    UsersModule,
  ],
  controllers: [ProductBuilderController],
  providers: [ProductBuilderService, ProductBuilderProcessor],
  exports: [ProductBuilderService],
})
export class ProductBuilderModule {}
