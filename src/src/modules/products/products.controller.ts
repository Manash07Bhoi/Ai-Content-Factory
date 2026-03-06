import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product, ProductType } from './entities/product.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}

export class CreateProductDto {
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

  @IsNumber()
  @Min(1)
  item_count: number;
}

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  async getPublished(@Query() pagination: PaginationDto) {
    return this.productsService.getPublishedProducts(pagination.page, pagination.limit);
  }

  @Get('admin/list')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.SUPER_ADMIN)
  async getAdminList(@Query() pagination: PaginationDto) {
    return this.productsService.getAdminProducts(pagination.page, pagination.limit);
  }

  @Public()
  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.createProduct(dto as any, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param('id') id: string, @Body() data: Partial<Product>) {
    return this.productsService.updateProduct(id, data);
  }

  @Patch(':id/publish')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async publish(@Param('id') id: string) {
    return this.productsService.publishProduct(id);
  }

  @Patch(':id/archive')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async archive(@Param('id') id: string) {
    return this.productsService.archiveProduct(id);
  }
}
