import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScriptsService } from './scripts.service';
import { Script, ScriptSchema } from './schemas/script.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Script.name, schema: ScriptSchema }])],
  providers: [ScriptsService],
  exports: [ScriptsService],
})
export class ScriptsModule {}