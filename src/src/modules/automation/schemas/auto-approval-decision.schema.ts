import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AutoApprovalDecisionDocument = AutoApprovalDecision & Document;

@Schema({ timestamps: true })
export class AutoApprovalDecision {
  @Prop({ required: true })
  batchId: string;

  @Prop({ required: true })
  contentId: string;

  @Prop({ required: true })
  decision: string; // 'auto_approved', 'auto_rejected', 'queued_for_review'

  @Prop()
  confidenceScore: number;
}

export const AutoApprovalDecisionSchema = SchemaFactory.createForClass(AutoApprovalDecision);
