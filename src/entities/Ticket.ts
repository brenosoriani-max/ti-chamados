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
import type { User } from "./User";
import type { Category } from "./Category";
import type { SubCategory } from "./SubCategory";
import type { TicketMessage } from "./TicketMessage";
import type { TicketAttachment } from "./TicketAttachment";
import type { TicketHistory } from "./TicketHistory";
import type { Equipment } from "./Equipment";

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

  @Column()
  clienteId!: string;

  @ManyToOne("User", (user: any) => user.ticketsCriados)
  cliente!: Relation<User>;

  @Column({ nullable: true })
  responsavelId?: string;

  @ManyToOne("User", (user: any) => user.ticketsAtendidos, { nullable: true })
  responsavel?: Relation<User>;

  @Column()
  categoryId!: string;

  @ManyToOne("Category", (cat: any) => cat.tickets)
  category!: Relation<Category>;

  @Column({ nullable: true })
  subCategoryId?: string;

  @ManyToOne("SubCategory", (sub: any) => sub.tickets, { nullable: true })
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

  @Column({ nullable: true })
  equipmentId?: string;

  @ManyToOne("Equipment", (eq: any) => eq.tickets, { onDelete: "SET NULL", nullable: true })
  equipment?: Relation<Equipment>;

  @OneToMany("TicketMessage", (msg: any) => msg.ticket)
  messages!: Relation<TicketMessage>[];

  @OneToMany("TicketAttachment", (attach: any) => attach.ticket)
  attachments!: Relation<TicketAttachment>[];

  @OneToMany("TicketHistory", (hist: any) => hist.ticket)
  history!: Relation<TicketHistory>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
