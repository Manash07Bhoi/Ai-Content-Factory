import { Injectable, Logger } from '@nestjs/common';
import { LLMClientService } from './llm-client.service';
import { PromptsService } from '../prompts/prompts.service';
import { PromptDocument } from '../prompts/schemas/prompt.schema';
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
  ) {}

  async generatePromptsBatch(batchId: string, topic: string, count: number): Promise<void> {
    const systemPrompt = this.loadPromptTemplate('system.txt');
    const userPromptTemplate = this.loadPromptTemplate('user-generate-prompts.txt');

    const userPrompt = this.renderTemplate(userPromptTemplate, { topic, count });

    this.logger.log(`Starting generation for batch ${batchId}`);

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
        // Here we'd typically have CategorisationService.scoreQuality() and ContentSafetyService.check()
        // For now, we mock a basic status assignment logic
        const status = 'pending'; // Should be determined by quality/safety checks later

        await this.promptsService.saveGeneratedPrompt({
          title: item.title,
          content: item.content,
          batchId,
          status,
          inProduct: false,
        });
      }

      this.logger.log(`Successfully generated and saved ${generatedItems.length} prompts for batch ${batchId}`);
    } catch (error) {
      this.logger.error(`Failed to parse AI output for batch ${batchId}: ${result.content}`);
      throw new Error(`AI generated invalid JSON format for batch ${batchId}`);
    }
  }

  private loadPromptTemplate(filename: string): string {
    const filePath = path.join(__dirname, 'prompts', filename);
    if (!fs.existsSync(filePath)) {
      this.logger.warn(`Template ${filename} not found at ${filePath}. Using fallback inline template.`);
      return filename === 'system.txt'
        ? 'You are an AI prompt generator. Output JSON arrays of {"title": "...", "content": "..."}.'
        : 'Generate {{count}} prompts about {{topic}}';
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
