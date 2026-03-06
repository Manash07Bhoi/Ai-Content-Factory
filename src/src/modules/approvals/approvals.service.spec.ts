import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalsService } from './approvals.service';
import { ApprovalsRepository } from './approvals.repository';
import { ApprovalStatus, Approval } from './entities/approval.entity';
import { NotFoundException } from '@nestjs/common';

describe('ApprovalsService', () => {
  let service: ApprovalsService;
  let repository: jest.Mocked<ApprovalsRepository>;

  beforeEach(async () => {
    const repoMock = {
      create: jest.fn(),
      findPending: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalsService,
        {
          provide: ApprovalsRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    service = module.get<ApprovalsService>(ApprovalsService);
    repository = module.get(ApprovalsRepository);
  });

  it('should create a pending approval', async () => {
    repository.create.mockResolvedValue({ id: '1' } as Approval);

    const result = await service.createPendingApproval('cid', 'prompts');

    expect(result.id).toBe('1');
    expect(repository.create).toHaveBeenCalledWith({
      content_id: 'cid',
      content_type: 'prompts',
      status: ApprovalStatus.PENDING,
    });
  });

  it('should approve an item', async () => {
    repository.findById.mockResolvedValue({ id: '1', status: ApprovalStatus.PENDING } as Approval);
    repository.updateStatus.mockResolvedValue({ id: '1', status: ApprovalStatus.APPROVED } as Approval);

    const result = await service.approve('1');
    expect(result!.status).toBe(ApprovalStatus.APPROVED);
    expect(repository.updateStatus).toHaveBeenCalledWith('1', ApprovalStatus.APPROVED);
  });

  it('should throw an exception when approving a non-existing item', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.approve('2')).rejects.toThrow(NotFoundException);
  });
});
