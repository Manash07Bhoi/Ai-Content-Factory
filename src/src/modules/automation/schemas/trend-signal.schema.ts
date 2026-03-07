import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TrendSignalDocument = TrendSignal & Document;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class TrendSignal {
  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  source: string; // google_trends|twitter|youtube|reddit|internal

  @Prop({ required: true })
  score: number; // 0-100 composite score

  @Prop({ required: true })
  velocity: string; // rising|stable|declining

  @Prop({ required: true })
  content_gap: number; // 0-100

  @Prop({ default: false })
  used_in_batch: boolean;

  @Prop()
  batch_id: string;

  @Prop({ required: true, expires: '48h' }) // 48h TTL
  expires_at: Date;

  created_at: Date;
}

export const TrendSignalSchema = SchemaFactory.createForClass(TrendSignal);
