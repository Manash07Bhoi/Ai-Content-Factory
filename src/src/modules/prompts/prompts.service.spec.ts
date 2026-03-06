import { Test, TestingModule } from '@nestjs/testing';
import { PromptsService } from './prompts.service';
import { PromptsRepository } from './prompts.repository';
import { getQueueToken } from '@nestjs/bullmq';
import { QUEUES } from '../../common/constants/queues.constant';
import { PromptDocument } from './schemas/prompt.schema';
import { randomUUID } from 'crypto';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('PromptsService', () => {
  let service: PromptsService;
  let repo: jest.Mocked<PromptsRepository>;
  let queue: any;

  beforeEach(async () => {
    const repoMock = {
      create: jest.fn(),
      findAllByBatchId: jest.fn(),
    };

    const queueMock = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptsService,
        {
          provide: PromptsRepository,
          useValue: repoMock,
        },
        {
          provide: getQueueToken(QUEUES.AI_GENERATION),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<PromptsService>(PromptsService);
    repo = module.get(PromptsRepository);
    queue = module.get(getQueueToken(QUEUES.AI_GENERATION));
  });

  it('should dispatch a job and return a batchId', async () => {
    queue.add.mockResolvedValue({ id: 'job-1' });

    const result = await service.generatePrompts('Cyberpunk', 5);

    expect(result.batchId).toBe('mocked-uuid');
    expect(result.message).toBe('Generation started asynchronously');
    expect(queue.add).toHaveBeenCalledWith('generate-content', {
      batchId: 'mocked-uuid',
      contentType: 'prompts',
      topic: 'Cyberpunk',
      count: 5,
    });
  });

  it('should save a generated prompt', async () => {
    const promptData = { title: 'Test', content: 'Test Content', batchId: 'batch-1' };
    repo.create.mockResolvedValue(promptData as PromptDocument);

    const result = await service.saveGeneratedPrompt(promptData);

    expect(result).toEqual(promptData);
    expect(repo.create).toHaveBeenCalledWith(promptData);
  });

  it('should get prompts by batchId', async () => {
    const mockPrompts = [{ title: 'P1' }, { title: 'P2' }];
    repo.findAllByBatchId.mockResolvedValue(mockPrompts as PromptDocument[]);

    const result = await service.getBatch('batch-1');

    expect(result).toEqual(mockPrompts);
    expect(repo.findAllByBatchId).toHaveBeenCalledWith('batch-1');
  });
});
