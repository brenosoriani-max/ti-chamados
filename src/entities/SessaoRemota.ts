import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { SessaoRemotaStatus } from "../types";
import { Terminal } from "./Terminal";
import { User } from "./User";

@Entity("sessoes_remotas")
@Index(["terminalId", "status"])
@Index(["usuarioId"])
@Index(["createdAt"])
export class SessaoRemota {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  terminalId!: string;

  @ManyToOne(() => Terminal, (t) => t.sessoesRemotas, { onDelete: "CASCADE" })
  terminal!: Terminal;

  @Column()
  usuarioId!: string;

  @ManyToOne(() => User, (u) => u.sessoesRemotas, { onDelete: "CASCADE" })
  usuario!: User;

  @Column({
    type: "enum",
    enum: SessaoRemotaStatus,
    default: SessaoRemotaStatus.AGUARDANDO,
  })
  status!: SessaoRemotaStatus;

  @Column({ type: "timestamp", nullable: true })
  iniciadaEm?: Date;

  @Column({ type: "timestamp", nullable: true })
  encerradaEm?: Date;

  @Column({ type: "longtext", nullable: true })
  logs?: string; // Stored as JSON string

  @Column({ type: "longtext", nullable: true })
  signaling?: string; // Stored as JSON string

  @CreateDateColumn()
  createdAt!: Date;
}
