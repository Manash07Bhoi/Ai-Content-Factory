import { Test, TestingModule } from '@nestjs/testing';
import { DownloadsService } from './downloads.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Download } from './entities/download.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { StorageService } from '../storage/storage.service';

describe('DownloadsService', () => {
  let service: DownloadsService;
  let downloadRepo: any;
  let orderItemRepo: any;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    downloadRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    orderItemRepo = { findOne: jest.fn() };
    const storageMock = { generateSignedUrl: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloadsService,
        { provide: getRepositoryToken(Download), useValue: downloadRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemRepo },
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get<DownloadsService>(DownloadsService);
    storageService = module.get(StorageService);
  });

  it('should generate a signed url if purchase is valid and limits ok', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      order: { id: 'o1' },
      product: { id: 'p1', file_url: 's3://x' },
    });
    downloadRepo.findOne.mockResolvedValue(null);
    downloadRepo.create.mockReturnValue({ download_count: 1 });
    storageService.generateSignedUrl.mockResolvedValue('http://signed.url');

    const result = await service.generateSignedUrl('p1', 'u1', '127.0.0.1', 'UA');
    expect(result).toBe('http://signed.url');
    expect(downloadRepo.save).toHaveBeenCalled();
  });

  it('should throw if download limit is exceeded', async () => {
    orderItemRepo.findOne.mockResolvedValue({
      order: { id: 'o1' },
      product: { id: 'p1', file_url: 's3://x' },
    });
    downloadRepo.findOne.mockResolvedValue({ download_count: 5 });

    await expect(service.generateSignedUrl('p1', 'u1', '127.0.0.1', 'UA')).rejects.toThrow(/Maximum download limit/);
  });
});
