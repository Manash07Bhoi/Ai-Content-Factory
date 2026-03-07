import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationScheduler } from './automation.scheduler';
import { QUEUES } from '../../common/constants/queues.constant';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentEmbedding } from './entities/content-embedding.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AutoApprovalDecision, AutoApprovalDecisionSchema } from './schemas/auto-approval-decision.schema';
import { TrendSignal, TrendSignalSchema } from './schemas/trend-signal.schema';
import { AutoApprovalService } from './auto-approval.service';
import { DeduplicationService } from './deduplication.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { AiGeneratorModule } from '../ai-generator/ai-generator.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: QUEUES.AI_GENERATION }),
    BullModule.registerQueue({ name: QUEUES.SEO_GENERATION }),
    BullModule.registerQueue({ name: QUEUES.CONTENT_EMBEDDING }),
    BullModule.registerQueue({ name: QUEUES.REPURPOSING }),
    BullModule.registerQueue({ name: QUEUES.TREND_INGESTION }),
    BullBoardModule.forFeature({ name: QUEUES.SEO_GENERATION, adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: QUEUES.CONTENT_EMBEDDING, adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: QUEUES.REPURPOSING, adapter: BullMQAdapter }),
    BullBoardModule.forFeature({ name: QUEUES.TREND_INGESTION, adapter: BullMQAdapter }),
    TypeOrmModule.forFeature([ContentEmbedding]),
    MongooseModule.forFeature([
      { name: AutoApprovalDecision.name, schema: AutoApprovalDecisionSchema },
      { name: TrendSignal.name, schema: TrendSignalSchema },
    ]),
    AiGeneratorModule,
  ],
  providers: [AutomationScheduler, AutoApprovalService, DeduplicationService, TrendAnalysisService],
  exports: [AutomationScheduler, AutoApprovalService, DeduplicationService, TrendAnalysisService],
})
export class AutomationModule {}
