import { Module, forwardRef } from '@nestjs/common';
import { LLMClientService } from './llm-client.service';
import { AiGeneratorService } from './ai-generator.service';
import { AiGeneratorProcessor } from './ai-generator.processor';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [forwardRef(() => PromptsModule)],
  providers: [LLMClientService, AiGeneratorService, AiGeneratorProcessor],
  exports: [AiGeneratorService, LLMClientService],
})
export class AiGeneratorModule {}