import { Injectable, Logger } from '@nestjs/common';
import { LLMClientService } from './llm-client.service';
import { PromptsService } from '../prompts/prompts.service';
import { ScriptsService } from '../scripts/scripts.service';
import { PostersService } from '../posters/posters.service';
import { SocialService } from '../social/social.service';
import { ContentSafetyService } from './safety/content-safety.service';
import { CategorisationService } from '../categorisation/categorisation.service';
import { ApprovalsService } from '../approvals/approvals.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenerationLog, GenerationLogDocument } from './schemas/generation_log.schema';
import * as fs from 'fs';
import * as path from 'path';

export interface PromptTemplateContext {
  topic: string;
  count: number;
  [key: string]: any;
}

@Injectable()
export class AiGeneratorService {
  private readonly logger = new Logger(AiGeneratorService.name);

  constructor(
    private readonly llmClientService: LLMClientService,
    private readonly promptsService: PromptsService,
    private readonly scriptsService: ScriptsService,
    private readonly postersService: PostersService,
    private readonly socialService: SocialService,
    private readonly contentSafetyService: ContentSafetyService,
    private readonly categorisationService: CategorisationService,
    private readonly approvalsService: ApprovalsService,
    @InjectModel(GenerationLog.name) private readonly generationLogModel: Model<GenerationLogDocument>,
  ) {}

  async generateBatch(batchId: string, contentType: string, topic: string, count: number): Promise<void> {
    const systemPrompt = this.loadPromptTemplate(`system-${contentType}.txt`, 'system.txt');
    const userPromptTemplate = this.loadPromptTemplate(`user-generate-${contentType}.txt`, 'user-generate-prompts.txt');

    const userPrompt = this.renderTemplate(userPromptTemplate, { topic, count });

    this.logger.log(`Starting generation for batch ${batchId} [${contentType}]`);

    const result = await this.llmClientService.generate({
      provider: 'openai', // Defaulting to OpenAI for Phase 1/2 prompts
      model: 'gpt-4o-mini',
      systemPrompt,
      userPrompt,
      maxTokens: 2048,
      temperature: 0.7,
    });

    try {
      // Parse the JSON array response
      const generatedItems: { title: string, content: string }[] = JSON.parse(result.content);

      for (const item of generatedItems) {
        let status = 'pending';
        let qualityScore = 0;
        let rejectionReason: string | undefined;
        let tags: string[] = [];

        try {
          await this.contentSafetyService.check(item.content);
          qualityScore = this.categorisationService.scoreQuality(item.content, contentType);
          tags = this.categorisationService.extractTags(item.content);

          if (qualityScore < 75) {
            status = 'rejected';
            rejectionReason = 'quality_below_threshold';
          }
        } catch (error) {
          status = 'safety_rejected';
          rejectionReason = error.message;
        }

        const saveData = {
          title: item.title,
          content: item.content,
          batchId,
          status,
          qualityScore,
          tags,
          rejectionReason,
          inProduct: false,
        };

        let savedDocument: any;

        if (contentType === 'scripts') {
          savedDocument = await this.scriptsService.saveGeneratedScript(saveData);
        } else if (contentType === 'posters') {
          savedDocument = await this.postersService.saveGeneratedPoster(saveData);
        } else if (contentType === 'social') {
          savedDocument = await this.socialService.saveGeneratedSocialPost(saveData);
        } else {
          savedDocument = await this.promptsService.saveGeneratedPrompt(saveData);
        }

        if (status === 'pending') {
           // Queue for human review if it passes initial automated thresholds
           await this.approvalsService.createPendingApproval(savedDocument._id.toString(), contentType);
        }
      }

      await this.generationLogModel.create({
        batchId,
        contentType,
        topic,
        requestedCount: count,
        generatedCount: generatedItems.length,
        costUsd: result.costUsd,
      });

      this.logger.log(`Successfully generated and saved ${generatedItems.length} items for batch ${batchId}`);
    } catch (error) {
      this.logger.error(`Failed to parse AI output for batch ${batchId}: ${result.content}`);
      await this.generationLogModel.create({
        batchId,
        contentType,
        topic,
        requestedCount: count,
        generatedCount: 0,
        error: error.message,
      });
      throw new Error(`AI generated invalid JSON format for batch ${batchId}`);
    }
  }

  private loadPromptTemplate(filename: string, fallbackFilename: string): string {
    const filePath = path.join(__dirname, 'prompts', filename);
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Template ${filename} not found at ${filePath}. Trying fallback ${fallbackFilename}`);
      const fallbackPath = path.join(__dirname, 'prompts', fallbackFilename);
      if (fs.existsSync(fallbackPath)) {
        return fs.readFileSync(fallbackPath, 'utf-8');
      }
      return 'You are an AI generator. Output JSON arrays of {"title": "...", "content": "..."}.';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  private renderTemplate(template: string, context: PromptTemplateContext): string {
    let rendered = template;
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }
    return rendered;
  }
}
