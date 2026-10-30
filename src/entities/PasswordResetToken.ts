import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("password_reset_tokens")
@Index("IDX_password_reset_tokens_userId", ["userId"])
export class PasswordResetToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  userId!: string;

  @Column({ type: "char", length: 64, unique: true })
  tokenHash!: string;

  @Column({ type: "datetime" })
  expiresAt!: Date;

  @Column({ type: "datetime", nullable: true })
  usedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}