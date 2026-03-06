import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ScriptDocument = Script & Document;

@Schema({ timestamps: true })
export class Script {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    required: true,
    enum: [
      'pending',
      'approved',
      'auto_approved',
      'rejected',
      'auto_rejected',
      'safety_rejected',
      'archived',
      'in_product',
    ],
    default: 'pending',
  })
  status: string;

  @Prop({ required: true })
  batchId: string;

  @Prop()
  rejectionReason?: string;

  @Prop({ default: false })
  inProduct: boolean;

  @Prop()
  qualityScore?: number;

  @Prop([String])
  tags?: string[];
}

export const ScriptSchema = SchemaFactory.createForClass(Script);
