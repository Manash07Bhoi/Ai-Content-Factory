import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ProductType {
  PROMPT_PACK = 'prompt_pack',
  POSTER_PACK = 'poster_pack',
  SCRIPT_PACK = 'script_pack',
  SOCIAL_PACK = 'social_pack',
}

export enum ProductStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 320 })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  short_description?: string;

  @Index()
  @Column({ type: 'enum', enum: ProductType })
  product_type: ProductType;

  @Index()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price?: number;

  @Column({ type: 'text', nullable: true })
  file_url?: string;

  @Column({ type: 'text', nullable: true })
  preview_url?: string;

  @Column({ type: 'text', nullable: true })
  thumbnail_url?: string;

  @Column({ type: 'int', default: 0 })
  item_count: number;

  @Index()
  @Column({ type: 'enum', enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Column({ type: 'text', array: true, nullable: true })
  tags?: string[];

  @Column({ type: 'int', default: 0 })
  view_count: number;

  @Column({ type: 'int', default: 0 })
  purchase_count: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @Column({ type: 'text', array: true, nullable: true })
  content_ids?: string[];

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at?: Date;
}