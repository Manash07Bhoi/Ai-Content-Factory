import { Injectable, Logger } from '@nestjs/common';
import { PromptsRepository } from './prompts.repository';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../common/constants/queues.constant';
import { randomUUID } from 'crypto';
import { PromptDocument } from './schemas/prompt.schema';

@Injectable()
export class PromptsService {
  private readonly logger = new Logger(PromptsService.name);

  constructor(
    private readonly promptsRepository: PromptsRepository,
    @InjectQueue(QUEUES.AI_GENERATION) private readonly aiGenerationQueue: Queue,
  ) {}

  async generatePrompts(topic: string, count: number): Promise<{ batchId: string, message: string }> {
    const batchId = randomUUID();

    // Dispatch a job to generate prompts asynchronously
    await this.aiGenerationQueue.add('generate-content', {
      batchId,
      contentType: 'prompts',
      topic,
      count,
    });

    this.logger.log(`Queued prompt generation for batch ${batchId} on topic ${topic}`);
    return { batchId, message: 'Generation started asynchronously' };
  }

  async saveGeneratedPrompt(data: Partial<PromptDocument>): Promise<PromptDocument> {
    return this.promptsRepository.create(data);
  }

  async getBatch(batchId: string): Promise<PromptDocument[]> {
    return this.promptsRepository.findAllByBatchId(batchId);
  }
}
