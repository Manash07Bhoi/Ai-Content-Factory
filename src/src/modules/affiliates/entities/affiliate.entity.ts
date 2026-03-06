import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('affiliates')
export class Affiliate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50 })
  referral_code: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 10.00 })
  commission_rate: number; // Percentage

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pending_balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  approved_balance: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
