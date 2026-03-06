import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SocialService } from './social.service';
import { SocialPost, SocialPostSchema } from './schemas/social_post.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SocialPost.name, schema: SocialPostSchema }])],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}