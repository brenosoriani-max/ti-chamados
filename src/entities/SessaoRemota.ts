import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
  Index,
} from "typeorm";
import { SessaoRemotaStatus } from "../types";
import type { Terminal } from "./Terminal";
import type { User } from "./User";

@Entity("sessoes_remotas")
@Index(["terminalId", "status"])
@Index(["usuarioId"])
@Index(["createdAt"])
export class SessaoRemota {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  terminalId!: string;

  @ManyToOne("Terminal", (t: any) => t.sessoesRemotas, { onDelete: "CASCADE" })
  terminal!: Relation<Terminal>;

  @Column()
  usuarioId!: string;

  @ManyToOne("User", (u: any) => u.sessoesRemotas, { onDelete: "CASCADE" })
  usuario!: Relation<User>;

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
  logs?: string;

  @Column({ type: "longtext", nullable: true })
  signaling?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
