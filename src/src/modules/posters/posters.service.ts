import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Poster, PosterDocument } from './schemas/poster.schema';

@Injectable()
export class PostersService {
  constructor(
    @InjectModel(Poster.name) private readonly posterModel: Model<PosterDocument>,
  ) {}

  async saveGeneratedPoster(data: Partial<PosterDocument>): Promise<PosterDocument> {
    const created = new this.posterModel(data);
    return created.save();
  }
}