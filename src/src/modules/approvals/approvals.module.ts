import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprovalsService } from './approvals.service';
import { ApprovalsRepository } from './approvals.repository';
import { ApprovalsController } from './approvals.controller';
import { Approval } from './entities/approval.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Approval])],
  controllers: [ApprovalsController],
  providers: [ApprovalsService, ApprovalsRepository],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}