import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  user_id: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ type: 'varchar', length: 255 })
  resource_type: string;

  @Column({ type: 'varchar', length: 255 })
  resource_id: string;

  @Column({ type: 'jsonb', nullable: true })
  details?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
