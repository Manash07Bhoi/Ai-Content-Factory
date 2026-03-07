import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrendSignal, TrendSignalDocument } from './schemas/trend-signal.schema';

@Injectable()
export class TrendAnalysisService {
  private readonly logger = new Logger(TrendAnalysisService.name);

  constructor(
    @InjectModel(TrendSignal.name)
    private readonly trendSignalModel: Model<TrendSignalDocument>,
  ) {}

  async fetchSignalsAndScore() {
    this.logger.log('Fetching trend signals from external sources...');

    // In a real implementation, we would call Google Trends API, Twitter API, etc.
    // For Phase 2 initialization, we mock these signals.
    const mockTopics = ['Cyberpunk Cityscapes', 'AI Marketing Tools', 'Minimalist UI Design', 'Retro 80s Aesthetics'];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h from now

    for (const topic of mockTopics) {
      const score = Math.floor(Math.random() * 40) + 60; // 60-100

      await this.trendSignalModel.create({
        topic,
        source: 'google_trends',
        score,
        velocity: 'rising',
        content_gap: Math.floor(Math.random() * 100),
        used_in_batch: false,
        expires_at: expiresAt,
      });
    }

    this.logger.log('Successfully aggregated and saved new trend signals.');
  }

  async getHotTopics(): Promise<string[]> {
    // Find unused topics with score >= 70
    const hotTrends = await this.trendSignalModel
      .find({ score: { $gte: 70 }, used_in_batch: false })
      .sort({ score: -1 })
      .limit(5)
      .exec();

    return hotTrends.map(t => t.topic);
  }

  async markTopicsUsed(batchId: string, topics: string[]) {
    await this.trendSignalModel.updateMany(
      { topic: { $in: topics }, used_in_batch: false },
      { $set: { used_in_batch: true, batch_id: batchId } }
    );
  }
}
