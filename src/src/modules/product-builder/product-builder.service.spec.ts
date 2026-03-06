import { Test, TestingModule } from '@nestjs/testing';
import { ProductBuilderService } from './product-builder.service';
import * as JSZip from 'jszip';

describe('ProductBuilderService', () => {
  let service: ProductBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductBuilderService],
    }).compile();

    service = module.get<ProductBuilderService>(ProductBuilderService);
  });

  it('should generate a PDF buffer from content items', async () => {
    const items = [
      { title: 'Test 1', content: 'Desc 1' },
      { title: 'Test 2', content: 'Desc 2' },
    ];
    const pdfBuffer = await service.generatePDF('My Title', items);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it('should create a zip pack containing the PDF and License', async () => {
    const pdfBuffer = Buffer.from('mock pdf content');
    const zipBuffer = await service.createZipPack(pdfBuffer, 'pack');
    expect(zipBuffer).toBeInstanceOf(Buffer);
    expect(zipBuffer.length).toBeGreaterThan(0);
  });
});
