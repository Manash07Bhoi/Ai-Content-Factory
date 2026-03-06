import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined; // No API keys initially, triggering fallback
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should fallback to mock upload if s3 client is not instantiated', async () => {
    const buffer = Buffer.from('mock');
    const result = await service.uploadFile(buffer, 'test.txt', 'text/plain', 'docs');
    expect(result).toContain('docs/');
    expect(result).toContain('.txt');
  });

  it('should generate a mock signed URL if s3 client is not instantiated', async () => {
    const url = await service.generateSignedUrl('docs/somekey.txt');
    expect(url).toContain('http://localhost:3000/mock-download/docs/somekey.txt');
  });
});
