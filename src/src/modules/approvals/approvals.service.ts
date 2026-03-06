import { Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalsRepository } from './approvals.repository';
import { ApprovalStatus } from './entities/approval.entity';

@Injectable()
export class ApprovalsService {
  constructor(private readonly approvalsRepository: ApprovalsRepository) {}

  async createPendingApproval(contentId: string, contentType: string) {
    return this.approvalsRepository.create({
      content_id: contentId,
      content_type: contentType,
      status: ApprovalStatus.PENDING,
    });
  }

  async getPendingApprovals(page: number = 1, limit: number = 20) {
    const [items, total] = await this.approvalsRepository.findPending(page, limit);
    return {
      items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async approve(id: string) {
    const approval = await this.approvalsRepository.findById(id);
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.approvalsRepository.updateStatus(id, ApprovalStatus.APPROVED);

    // In reality, this would trigger an event or queue job to update the MongoDB status to 'approved'
    // and potentially start the product builder if the batch is ready.

    return updated;
  }

  async reject(id: string, reason: string) {
    const approval = await this.approvalsRepository.findById(id);
    if (!approval) throw new NotFoundException('Approval not found');

    const updated = await this.approvalsRepository.updateStatus(id, ApprovalStatus.REJECTED, reason);

    // In reality, this would trigger an event to update MongoDB status to 'rejected'

    return updated;
  }
}
