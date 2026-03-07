import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContentEmbedding } from './entities/content-embedding.entity';
import { LLMClientService } from '../ai-generator/llm-client.service';

@Injectable()
export class DeduplicationService {
  private readonly logger = new Logger(DeduplicationService.name);

  // PRD Thresholds
  private readonly AUTO_REJECT_THRESHOLD = 0.92;
  private readonly FLAG_THRESHOLD = 0.80;

  constructor(
    @InjectRepository(ContentEmbedding)
    private readonly embeddingRepo: Repository<ContentEmbedding>,
    private readonly llmClient: LLMClientService,
  ) {}

  async checkDuplicate(text: string, contentType: string, category: string): Promise<{ isDuplicate: boolean, isFlagged: boolean, similarity: number }> {
    try {
      // Generate 1536-dimension vector embedding (mocked or real depending on LLM config)
      const embedding = await this.llmClient.generateEmbedding(text);

      // PostgreSQL pgvector cosine similarity search
      // The `<=>` operator computes cosine distance (1 - cosine_similarity).
      // We want to find the nearest neighbor in the same category.
      const nearest = await this.embeddingRepo
        .createQueryBuilder('ce')
        .select(['ce.id', 'ce.content_id', '(1 - (ce.embedding <=> :embedding::vector)) as similarity'])
        .where('ce.content_type = :contentType', { contentType })
        .andWhere('ce.category = :category', { category })
        .setParameters({ embedding: `[${embedding.join(',')}]` })
        .orderBy('ce.embedding <=> :embedding::vector', 'ASC')
        .limit(1)
        .getRawOne();

      if (!nearest) {
        return { isDuplicate: false, isFlagged: false, similarity: 0 };
      }

      const similarity = parseFloat(nearest.similarity);

      if (similarity > this.AUTO_REJECT_THRESHOLD) {
        return { isDuplicate: true, isFlagged: false, similarity };
      }

      if (similarity >= this.FLAG_THRESHOLD && similarity <= this.AUTO_REJECT_THRESHOLD) {
        return { isDuplicate: false, isFlagged: true, similarity };
      }

      return { isDuplicate: false, isFlagged: false, similarity };
    } catch (err) {
      this.logger.error(`Failed deduplication check: ${err.message}`);
      // Fail open if embedding system goes down so we don't halt all production
      return { isDuplicate: false, isFlagged: false, similarity: 0 };
    }
  }

  async storeEmbedding(contentId: string, contentType: string, category: string, text: string) {
    try {
      const embedding = await this.llmClient.generateEmbedding(text);

      const record = this.embeddingRepo.create({
        content_id: contentId,
        content_type: contentType,
        category,
        embedding,
      });

      await this.embeddingRepo.save(record);
      this.logger.log(`Stored vector embedding for content ${contentId}`);
    } catch (err) {
      this.logger.error(`Failed to store embedding for ${contentId}: ${err.message}`);
    }
  }
}
