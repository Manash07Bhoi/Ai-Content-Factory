import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export interface GenerateParams {
  provider: 'openai' | 'anthropic';
  model: string;
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  content: string;
  tokensUsed: number;
  model: string;
  provider: string;
  costUsd: number;
}

@Injectable()
export class LLMClientService {
  private readonly logger = new Logger(LLMClientService.name);
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private isDev: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isDev = this.configService.get('NODE_ENV') !== 'production';

    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiKey) {
      this.openai = new OpenAI({ apiKey: openaiKey });
    } else {
      this.logger.warn('OPENAI_API_KEY not found. Fallback mode will be used for OpenAI requests.');
    }

    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicKey });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not found. Fallback mode will be used for Anthropic requests.');
    }
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    if (this.shouldUseFallback(params.provider)) {
      return this.generateMock(params);
    }

    try {
      if (params.provider === 'openai') {
        return this.generateWithOpenAI(params);
      } else if (params.provider === 'anthropic') {
        return this.generateWithAnthropic(params);
      }
      throw new Error(`Unsupported provider: ${params.provider}`);
    } catch (error) {
      this.logger.error(`Error generating with ${params.provider}: ${error.message}`);
      if (this.isDev) {
        this.logger.warn(`Falling back to mock generation due to error.`);
        return this.generateMock(params);
      }
      throw error;
    }
  }

  private shouldUseFallback(provider: 'openai' | 'anthropic'): boolean {
    if (provider === 'openai' && !this.openai) return true;
    if (provider === 'anthropic' && !this.anthropic) return true;
    return false; // Real integration available
  }

  private async generateWithOpenAI(params: GenerateParams): Promise<GenerateResult> {
    const response = await this.openai!.chat.completions.create({
      model: params.model,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt }
      ],
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
    });

    const content = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    // Simple cost estimation (replace with actual pricing logic per model if needed)
    const costUsd = this.estimateCost(params.model, tokensUsed);

    return {
      content,
      tokensUsed,
      model: params.model,
      provider: 'openai',
      costUsd
    };
  }

  private async generateWithAnthropic(params: GenerateParams): Promise<GenerateResult> {
    const response = await this.anthropic!.messages.create({
      model: params.model,
      system: params.systemPrompt,
      messages: [
        { role: 'user', content: params.userPrompt }
      ],
      max_tokens: params.maxTokens || 1024,
      temperature: params.temperature || 0.7,
    });

    const content = response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
    const tokensUsed = response.usage?.input_tokens + response.usage?.output_tokens || 0;

    const costUsd = this.estimateCost(params.model, tokensUsed);

    return {
      content,
      tokensUsed,
      model: params.model,
      provider: 'anthropic',
      costUsd
    };
  }

  private generateMock(params: GenerateParams): GenerateResult {
    this.logger.debug(`Using mock fallback for ${params.provider} / ${params.model}`);

    // Very basic JSON generation mock if requested topic suggests JSON structure is needed
    // In our prompts we expect JSON arrays of prompts
    const mockContent = `[
      {
        "title": "Mock generated prompt for ${params.userPrompt.substring(0, 20)}",
        "content": "A highly detailed mock prompt about ${params.userPrompt.substring(0, 20)}..."
      }
    ]`;

    return {
      content: mockContent,
      tokensUsed: 150,
      model: `mock-${params.model}`,
      provider: `mock-${params.provider}`,
      costUsd: 0.0001
    };
  }

  private estimateCost(model: string, tokens: number): number {
    // Basic estimation (e.g. $0.002 per 1k tokens combined)
    // Real implementation would look up cost per model per input/output token
    return (tokens / 1000) * 0.002;
  }
}
