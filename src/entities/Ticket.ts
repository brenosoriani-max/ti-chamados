import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  type Relation,
} from "typeorm";
import { TicketStatus, Priority } from "../types";
import { User } from "./User";
import { Category } from "./Category";
import { SubCategory } from "./SubCategory";
import { TicketMessage } from "./TicketMessage";
import { TicketAttachment } from "./TicketAttachment";
import { TicketHistory } from "./TicketHistory";
import { Equipment } from "./Equipment";

@Entity("tickets")
@Index(["status", "prioridade"])
@Index(["isArchived"])
@Index(["clienteId"])
@Index(["responsavelId"])
@Index(["slaDueAt"])
@Index(["updatedAt"])
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  protocolo!: string;

  @Column({ type: "varchar", length: 255 })
  titulo!: string;

  @Column({ type: "text" })
  descricao!: string;

  @Column({
    type: "enum",
    enum: TicketStatus,
    default: TicketStatus.ABERTO,
  })
  status!: TicketStatus;

  @Column({
    type: "enum",
    enum: Priority,
    default: Priority.MEDIA,
  })
  prioridade!: Priority;

  @Column({ type: "varchar", length: 36 })
  clienteId!: string;

  @ManyToOne(() => User, (user) => user.ticketsCriados)
  cliente!: Relation<User>;

  @Column({ type: "varchar", length: 36, nullable: true })
  responsavelId?: string;

  @ManyToOne(() => User, (user) => user.ticketsAtendidos, { nullable: true })
  responsavel?: Relation<User>;

  @Column({ type: "varchar", length: 36 })
  categoryId!: string;

  @ManyToOne(() => Category, (cat) => cat.tickets)
  category!: Relation<Category>;

  @Column({ type: "varchar", length: 36, nullable: true })
  subCategoryId?: string;

  @ManyToOne(() => SubCategory, (sub) => sub.tickets, { nullable: true })
  subCategory?: Relation<SubCategory>;

  @Column({ type: "varchar", length: 255, nullable: true })
  equipe?: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  dataAbertura!: Date;

  @Column({ type: "timestamp", nullable: true })
  dataFechamento?: Date;

  @Column({ type: "boolean", default: false })
  isArchived!: boolean;

  @Column({ type: "varchar", length: 45, nullable: true })
  creatorIp?: string;

  @Column({ type: "timestamp", nullable: true })
  slaDueAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  responseDueAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  firstResponseAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  closedAt?: Date;

  @Column({ type: "varchar", length: 36, nullable: true })
  equipmentId?: string;

  @ManyToOne(() => Equipment, (eq) => eq.tickets, { onDelete: "SET NULL", nullable: true })
  equipment?: Relation<Equipment>;

  @OneToMany(() => TicketMessage, (msg) => msg.ticket)
  messages!: Relation<TicketMessage>[];

  @OneToMany(() => TicketAttachment, (attach) => attach.ticket)
  attachments!: Relation<TicketAttachment>[];

  @OneToMany(() => TicketHistory, (hist) => hist.ticket)
  history!: Relation<TicketHistory>[];

  @Column({ type: "text", nullable: true })
  conclusaoAtendimento?: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  transferredFromUserId?: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  transferredToUserId?: string;

  @Column({ type: "varchar", length: 80, nullable: true })
  transferReason?: string;

  @Column({ type: "text", nullable: true })
  backupNotes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
