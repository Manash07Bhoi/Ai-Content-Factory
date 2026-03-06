import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostersService } from './posters.service';
import { Poster, PosterSchema } from './schemas/poster.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Poster.name, schema: PosterSchema }])],
  providers: [PostersService],
  exports: [PostersService],
})
export class PostersModule {}