import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AutoApprovalDecision, AutoApprovalDecisionDocument } from './schemas/auto-approval-decision.schema';

@Injectable()
export class AutoApprovalService {
  private readonly logger = new Logger(AutoApprovalService.name);

  // Default thresholds per PRD
  private readonly autoApproveThreshold = 0.94;
  private readonly autoRejectThreshold = 0.90;
  private readonly spotCheckRate = 0.10;

  constructor(
    @InjectModel(AutoApprovalDecision.name)
    private readonly decisionModel: Model<AutoApprovalDecisionDocument>,
  ) {}

  async evaluate(item: any, contentType: string): Promise<string> {
    // In a real system, this would call an ML inference endpoint or use a loaded logistic regression model.
    // For now, we mock the confidence score based on the item's quality score.
    const qualityScore = item.quality_score || 80;

    // Mock confidence calculation (just for demonstration)
    const confidence = Math.min(1.0, qualityScore / 100 + (Math.random() * 0.1));

    let predictedLabel = 'human_review';
    let newStatus = 'pending';

    if (confidence >= this.autoApproveThreshold) {
      predictedLabel = 'approved';
      newStatus = 'auto_approved';
    } else if (confidence <= this.autoRejectThreshold && confidence < 0.85) {
      // added <0.85 condition to ensure we don't reject everything below 0.90
      predictedLabel = 'rejected';
      newStatus = 'auto_rejected';
    }

    const wasSpotChecked = newStatus === 'auto_approved' && Math.random() < this.spotCheckRate;

    // Record the decision
    await this.decisionModel.create({
      batchId: item.batch_id || 'unknown',
      contentId: item._id?.toString() || item.id,
      contentType,
      decision: newStatus,
      confidenceScore: confidence,
      predictedLabel,
      featureVector: { quality_score: qualityScore, length: item.prompt_text?.length || 0 },
      modelVersion: 'v1.0.0-logistic-mock',
      wasSpotChecked,
    });

    this.logger.log(`AutoApproval evaluated ${contentType} ${item._id}: confidence=${confidence.toFixed(3)} -> ${newStatus}`);

    return newStatus;
  }
}
