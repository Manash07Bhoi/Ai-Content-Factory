import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument } from './schemas/prompt.schema';

@Injectable()
export class PromptsRepository {
  constructor(
    @InjectModel(Prompt.name) private readonly promptModel: Model<PromptDocument>,
  ) {}

  async create(data: Partial<Prompt>): Promise<PromptDocument> {
    const createdPrompt = new this.promptModel(data);
    return createdPrompt.save();
  }

  async findById(id: string): Promise<PromptDocument | null> {
    return this.promptModel.findById(id).exec();
  }

  async findAllByBatchId(batchId: string): Promise<PromptDocument[]> {
    return this.promptModel.find({ batchId }).exec();
  }

  async updateStatus(id: string, status: string, rejectionReason?: string): Promise<PromptDocument | null> {
    return this.promptModel.findByIdAndUpdate(
      id,
      { status, rejectionReason },
      { new: true }
    ).exec();
  }
}
