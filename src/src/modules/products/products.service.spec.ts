import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { Product, ProductStatus } from './entities/product.entity';
import { User } from '../users/entities/user.entity';

describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;

  beforeEach(async () => {
    const repoMock = {
      create: jest.fn(),
      findPublished: jest.fn(),
      findAllAdmin: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(ProductsRepository);
  });

  it('should create a product', async () => {
    repository.create.mockResolvedValue({ id: '1', title: 'Pack' } as Product);
    const result = await service.createProduct({ title: 'Pack', price: 10 }, { id: 'u1' } as User);
    expect(result.id).toBe('1');
    expect(repository.create).toHaveBeenCalledWith({ title: 'Pack', price: 10 }, { id: 'u1' });
  });

  it('should not allow price below $0.99', async () => {
    await expect(service.createProduct({ title: 'Pack', price: 0.50 }, { id: 'u1' } as User)).rejects.toThrow();
  });

  it('should publish a product if file_url exists', async () => {
    repository.findById.mockResolvedValue({ id: '1', file_url: 's3://url' } as Product);
    repository.update.mockResolvedValue({ id: '1', status: ProductStatus.PUBLISHED } as Product);

    const result = await service.publishProduct('1');
    expect(result.status).toBe(ProductStatus.PUBLISHED);
  });

  it('should fail to publish if file_url is missing', async () => {
    repository.findById.mockResolvedValue({ id: '1' } as Product);
    await expect(service.publishProduct('1')).rejects.toThrow('Cannot publish product without a file_url');
  });
});
