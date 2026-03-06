import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalStatus } from './entities/approval.entity';

@Injectable()
export class ApprovalsRepository {
  constructor(
    @InjectRepository(Approval)
    private readonly repository: Repository<Approval>,
  ) {}

  async create(data: Partial<Approval>): Promise<Approval> {
    const approval = this.repository.create(data);
    return this.repository.save(approval);
  }

  async findPending(page: number, limit: number): Promise<[Approval[], number]> {
    return this.repository.findAndCount({
      where: { status: ApprovalStatus.PENDING },
      take: limit,
      skip: (page - 1) * limit,
      order: { created_at: 'DESC' },
    });
  }

  async updateStatus(id: string, status: ApprovalStatus, rejection_reason?: string): Promise<Approval | null> {
    await this.repository.update(id, { status, rejection_reason });
    return this.repository.findOne({ where: { id } });
  }

  async findById(id: string): Promise<Approval | null> {
    return this.repository.findOne({ where: { id } });
  }
}
