import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { TerminalStatus } from "../types";
import { SessaoRemota } from "./SessaoRemota";

@Entity("terminals")
@Index(["status"])
@Index(["empresaId"])
@Index(["ultimaConexao"])
export class Terminal {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  nome!: string;

  @Column({ type: "text", nullable: true })
  descricao?: string;

  @Column({ type: "varchar", length: 191, unique: true })
  identificador!: string;

  @Column({ type: "varchar", length: 191, unique: true })
  token!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  empresaId?: string;

  @Column({
    type: "enum",
    enum: TerminalStatus,
    default: TerminalStatus.OFFLINE,
  })
  status!: TerminalStatus;

  @Column({ type: "timestamp", nullable: true })
  ultimaConexao?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  sistemaOperacional?: string;

  @Column({ type: "varchar", length: 45, nullable: true })
  ip?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  versaoAgente?: string;

  @OneToMany(() => SessaoRemota, (sessao) => sessao.terminal)
  sessoesRemotas!: SessaoRemota[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
