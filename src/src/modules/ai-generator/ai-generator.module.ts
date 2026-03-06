import { Module, forwardRef } from '@nestjs/common';
import { LLMClientService } from './llm-client.service';
import { AiGeneratorService } from './ai-generator.service';
import { AiGeneratorProcessor } from './ai-generator.processor';
import { PromptsModule } from '../prompts/prompts.module';
import { ContentSafetyService } from './safety/content-safety.service';
import { CategorisationModule } from '../categorisation/categorisation.module';
import { ScriptsModule } from '../scripts/scripts.module';
import { PostersModule } from '../posters/posters.module';
import { SocialModule } from '../social/social.module';
import { GenerationLog, GenerationLogSchema } from './schemas/generation_log.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalsModule } from '../approvals/approvals.module';

@Module({
  imports: [
    forwardRef(() => PromptsModule),
    CategorisationModule,
    ScriptsModule,
    PostersModule,
    SocialModule,
    ApprovalsModule,
    MongooseModule.forFeature([{ name: GenerationLog.name, schema: GenerationLogSchema }]),
  ],
  providers: [
    LLMClientService,
    AiGeneratorService,
    AiGeneratorProcessor,
    ContentSafetyService,
  ],
  exports: [AiGeneratorService, LLMClientService, ContentSafetyService],
})
export class AiGeneratorModule {}