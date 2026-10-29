import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import { User } from "./User";

export enum BackupStatus {
  SUCESSO = "SUCESSO",
  ERRO = "ERRO",
  EM_ANDAMENTO = "EM_ANDAMENTO",
}

@Entity("backup_logs")
export class BackupLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  triggeredById?: string;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true })
  triggeredBy?: Relation<User>;

  @Column({ type: "enum", enum: BackupStatus, default: BackupStatus.EM_ANDAMENTO })
  status!: BackupStatus;

  @Column({ type: "varchar", length: 500, nullable: true })
  filePath?: string;

  @Column({ type: "bigint", nullable: true })
  fileSizeBytes?: number;

  @Column({ type: "text", nullable: true })
  errorMessage?: string;

  @Column({ type: "int", nullable: true })
  durationMs?: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  backupType?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
