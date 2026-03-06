import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../common/constants/queues.constant';
import { ProductBuilderService } from './product-builder.service';
import { StorageService } from '../storage/storage.service';
import { ProductsService } from '../products/products.service';
import { ProductType } from '../products/entities/product.entity';
import { CreatePackDto } from './product-builder.controller';
import { UsersService } from '../users/users.service';

export interface BuildPackJobData {
  dto: CreatePackDto;
  userId: string;
}

@Processor(QUEUES.PRODUCT_BUILDER)
export class ProductBuilderProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductBuilderProcessor.name);

  constructor(
    private readonly productBuilderService: ProductBuilderService,
    private readonly storageService: StorageService,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {
    super();
  }

  async process(job: Job<BuildPackJobData, void, string>): Promise<any> {
    const { dto, userId } = job.data;
    this.logger.log(`Processing build-pack job ${job.id} for product ${dto.title}`);

    try {
      // In a real scenario, fetch the content strings from MongoDB using `content_ids`.
      // We will mock this data fetching step.
      const mockItems = dto.content_ids.map((id, index) => ({
        title: `Asset ${index + 1}`,
        content: `Detailed content description for asset ID: ${id}.`,
      }));

      // Step 1: Generate PDF
      const pdfBuffer = await this.productBuilderService.generatePDF(dto.title, mockItems);

      // Step 2: Generate ZIP Pack
      const zipBuffer = await this.productBuilderService.createZipPack(pdfBuffer, 'content-pack');

      // Step 3: Upload to Storage (S3)
      const sanitizedTitle = dto.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const s3Key = await this.storageService.uploadFile(
        zipBuffer,
        `${sanitizedTitle}.zip`,
        'application/zip',
        'products'
      );

      // Step 4: Create Draft Product in PostgreSQL
      const user = await this.usersService.findOne(userId);
      if (!user) throw new Error('User not found');

      const product = await this.productsService.createProduct({
        title: dto.title,
        description: dto.description,
        product_type: dto.product_type,
        price: dto.price,
        item_count: mockItems.length,
        content_ids: dto.content_ids,
        file_url: s3Key,
        status: 'draft' as any,
      }, user as any); // cast to avoid UserResponseDto mismatch in mock scenario

      this.logger.log(`Successfully built pack and created product draft: ${product.id}`);
      return { success: true, productId: product.id, fileUrl: s3Key };
    } catch (error) {
      this.logger.error(`Failed to build pack for job ${job.id}: ${error.message}`);
      throw error;
    }
  }
}
