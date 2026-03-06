import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Script, ScriptDocument } from './schemas/script.schema';

@Injectable()
export class ScriptsService {
  constructor(
    @InjectModel(Script.name) private readonly scriptModel: Model<ScriptDocument>,
  ) {}

  async saveGeneratedScript(data: Partial<ScriptDocument>): Promise<ScriptDocument> {
    const created = new this.scriptModel(data);
    return created.save();
  }
}
