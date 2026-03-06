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

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: QUEUES.AI_GENERATION }),
    BullModule.registerQueue({ name: QUEUES.SEO_GENERATION }),
    BullBoardModule.forFeature({ name: QUEUES.SEO_GENERATION, adapter: BullMQAdapter }),
    TypeOrmModule.forFeature([ContentEmbedding]),
    MongooseModule.forFeature([{ name: AutoApprovalDecision.name, schema: AutoApprovalDecisionSchema }]),
  ],
  providers: [AutomationScheduler],
  exports: [AutomationScheduler],
})
export class AutomationModule {}
