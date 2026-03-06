import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GenerationLogDocument = GenerationLog & Document;

@Schema({ timestamps: true })
export class GenerationLog {
  @Prop({ required: true })
  batchId: string;

  @Prop({ required: true })
  contentType: string; // 'prompts', 'scripts', 'posters', 'social'

  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  requestedCount: number;

  @Prop({ required: true })
  generatedCount: number;

  @Prop()
  error?: string;

  @Prop({ default: 0 })
  costUsd: number;
}

export const GenerationLogSchema = SchemaFactory.createForClass(GenerationLog);
