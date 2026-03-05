import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PromptsRepository } from './prompts.repository';
import { Prompt, PromptSchema } from './schemas/prompt.schema';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QUEUES } from '../../common/constants/queues.constant';
import { AiGeneratorModule } from '../ai-generator/ai-generator.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Prompt.name, schema: PromptSchema }]),
    BullModule.registerQueue({
      name: QUEUES.AI_GENERATION,
    }),
    BullBoardModule.forFeature({
      name: QUEUES.AI_GENERATION,
      adapter: BullMQAdapter,
    }),
    forwardRef(() => AiGeneratorModule),
  ],
  controllers: [PromptsController],
  providers: [PromptsService, PromptsRepository],
  exports: [PromptsService],
})
export class PromptsModule {}
