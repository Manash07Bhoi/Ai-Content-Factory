import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../../common/constants/queues.constant';
import { randomUUID } from 'crypto';

@Injectable()
export class AutomationScheduler {
  private readonly logger = new Logger(AutomationScheduler.name);

  constructor(
    @InjectQueue(QUEUES.AI_GENERATION) private readonly aiGenerationQueue: Queue,
    @InjectQueue(QUEUES.SEO_GENERATION) private readonly seoGenerationQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handlePromptGeneration() {
    this.logger.log('Triggering scheduled prompt generation...');
    await this.aiGenerationQueue.add('generate-content', {
      batchId: randomUUID(),
      contentType: 'prompts',
      topic: 'Trending Daily Scifi',
      count: 50,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleScriptGeneration() {
    this.logger.log('Triggering scheduled script generation...');
    await this.aiGenerationQueue.add('generate-content', {
      batchId: randomUUID(),
      contentType: 'scripts',
      topic: 'Educational Tech',
      count: 10,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async handlePosterGeneration() {
    this.logger.log('Triggering scheduled poster generation...');
    await this.aiGenerationQueue.add('generate-content', {
      batchId: randomUUID(),
      contentType: 'posters',
      topic: 'Minimalist Architecture',
      count: 20,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleSocialPostGeneration() {
    this.logger.log('Triggering scheduled social post generation...');
    await this.aiGenerationQueue.add('generate-content', {
      batchId: randomUUID(),
      contentType: 'social',
      topic: 'Business Marketing Tips',
      count: 30,
    });
  }

  // Session 30: SEO Metadata Generation mock
  async triggerSeoGeneration(productId: string) {
    this.logger.log(`Queuing SEO Generation for Product ${productId}`);
    await this.seoGenerationQueue.add('generate-seo', { productId });
  }
}
