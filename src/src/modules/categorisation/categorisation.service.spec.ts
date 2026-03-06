import { Test, TestingModule } from '@nestjs/testing';
import { CategorisationService } from './categorisation.service';

describe('CategorisationService', () => {
  let service: CategorisationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategorisationService],
    }).compile();

    service = module.get<CategorisationService>(CategorisationService);
  });

  it('should score quality accurately', () => {
    const score = service.scoreQuality('This is a very short text', 'general');
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);

    const highQuality = service.scoreQuality('A detailed cinematic description of a futuristic city with bright neon lights.\n\nIt features deep character development.', 'prompts');
    expect(highQuality).toBeGreaterThan(score);
  });

  it('should extract tags from text', () => {
    const text = 'This is a #cyberpunk text that is very cinematic';
    const tags = service.extractTags(text);
    expect(tags).toContain('cyberpunk');
    expect(tags).toContain('cinematic');
  });

  it('should categorise text', () => {
    expect(service.categorise('A great marketing strategy')).toBe('Business & Marketing');
    expect(service.categorise('A cinematic art piece')).toBe('Art & Design');
    expect(service.categorise('Just a normal day')).toBe('General');
  });
});
