import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../common/constants/queues.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { IsString, IsNotEmpty, IsNumber, Min, IsArray, IsEnum } from 'class-validator';
import { ProductType } from '../products/entities/product.entity';

export class CreatePackDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ProductType)
  product_type: ProductType;

  @IsNumber()
  @Min(0.99)
  price: number;

  @IsArray()
  @IsString({ each: true })
  content_ids: string[];
}

@Controller('product-builder')
export class ProductBuilderController {
  constructor(
    @InjectQueue(QUEUES.PRODUCT_BUILDER) private readonly queue: Queue,
  ) {}

  @Post('create-pack')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async createPack(@Body() dto: CreatePackDto, @CurrentUser() user: any) {
    // Basic validation on size
    if (dto.content_ids.length < 3) {
      throw new Error('A minimum of 3 content items is required.');
    }

    const job = await this.queue.add('build-pack', {
      dto,
      userId: user.sub,
    });

    return { jobId: job.id, message: 'Pack generation queued successfully.' };
  }
}
