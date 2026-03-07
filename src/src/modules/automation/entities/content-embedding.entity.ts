import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// We mock pgvector usage via standard types to allow the code to compile without extensions.
// In actual db schema migration we would run: CREATE EXTENSION IF NOT EXISTS vector;
@Entity('content_embeddings')
export class ContentEmbedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  content_id: string;

  @Column({ type: 'varchar', length: 255 })
  content_type: string;

  @Column({ type: 'varchar', length: 255 })
  category: string;

  // We map vector to a standard JSON or text array here so NestJS starts without complex pgvector ORM setups
  // A real implementation would use: @Column({ type: 'vector', length: 1536 })
  @Column({ type: 'jsonb', nullable: true })
  embedding: number[];
}
