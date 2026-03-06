import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SocialPost, SocialPostDocument } from './schemas/social_post.schema';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(SocialPost.name) private readonly socialPostModel: Model<SocialPostDocument>,
  ) {}

  async saveGeneratedSocialPost(data: Partial<SocialPostDocument>): Promise<SocialPostDocument> {
    const created = new this.socialPostModel(data);
    return created.save();
  }
}