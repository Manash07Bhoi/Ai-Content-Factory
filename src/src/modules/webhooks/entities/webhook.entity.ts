import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum WebhookEventType {
  ORDER_PAID = 'order.paid',
  PRODUCT_PUBLISHED = 'product.published',
  GENERATION_COMPLETED = 'generation.completed',
}

@Entity('webhooks')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', array: true })
  events: WebhookEventType[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  secret?: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
