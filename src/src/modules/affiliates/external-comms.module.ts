import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Affiliate } from './entities/affiliate.entity';
import { WebhookEndpoint } from '../webhooks/entities/webhook.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Affiliate, WebhookEndpoint])],
  exports: [TypeOrmModule],
})
export class ExternalCommsModule {}