import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../../common/constants/queues.constant';
import { AiGeneratorService } from './ai-generator.service';

export interface ContentGenerationJobData {
  batchId: string;
  contentType: string; // prompts, scripts, posters, social
  topic: string;
  count: number;
}

@Processor(QUEUES.AI_GENERATION)
export class AiGeneratorProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGeneratorProcessor.name);

  constructor(private readonly aiGeneratorService: AiGeneratorService) {
    super();
  }

  async process(job: Job<ContentGenerationJobData, void, string>): Promise<any> {
    const { batchId, contentType, topic, count } = job.data;
    this.logger.log(`Processing job ${job.id} for batch ${batchId} (${contentType})`);

    try {
      await this.aiGeneratorService.generateBatch(batchId, contentType, topic, count);
      this.logger.log(`Job ${job.id} completed successfully for batch ${batchId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Job ${job.id} failed for batch ${batchId}: ${error.message}`);
      throw error; // Let BullMQ retry
    }
  }
}
