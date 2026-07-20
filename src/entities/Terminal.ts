import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  type Relation,
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

  @Column({ type: "varchar", length: 191, nullable: true })
  equipmentUuid?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  hostname?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  windowsVersion?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  arquitetura?: string;

  @Column({ type: "int", nullable: true })
  memoriaRamGb?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  processador?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  usuarioLogado?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  resolucaoTela?: string;

  @Column({ type: "int", nullable: true })
  quantidadeMonitores?: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 36, nullable: true })
  userId?: string;

  @OneToMany(() => SessaoRemota, (sessao) => sessao.terminal)
  sessoesRemotas!: Relation<SessaoRemota>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
