import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export class ContentSafetyException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentSafetyException';
  }
}

@Injectable()
export class ContentSafetyService {
  private readonly logger = new Logger(ContentSafetyService.name);

  constructor(private readonly configService: ConfigService) {}

  async check(text: string): Promise<void> {
    const isDev = this.configService.get('NODE_ENV') !== 'production';

    // In a real application, call the OpenAI Moderation API here via HTTP or SDK
    if (isDev) {
      this.logger.debug('Running mock content safety check');

      const blacklist = ['nsfw', 'violence', 'hate-speech', 'illegal-substance'];
      const textLower = text.toLowerCase();

      for (const word of blacklist) {
        if (textLower.includes(word)) {
          throw new ContentSafetyException(`Content rejected due to safety violation: detected prohibited keyword '${word}'`);
        }
      }
      return;
    }

    // Example real implementation logic:
    // const moderation = await openai.moderations.create({ input: text });
    // if (moderation.results[0].flagged) {
    //   throw new ContentSafetyException('Content flagged by OpenAI moderation API');
    // }
  }
}
