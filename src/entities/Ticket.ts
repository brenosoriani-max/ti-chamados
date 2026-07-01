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
  BeforeInsert,
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

  @Column()
  clienteId!: string;

  @ManyToOne(() => User, (user) => user.ticketsCriados)
  cliente!: User;

  @Column({ nullable: true })
  responsavelId?: string;

  @ManyToOne(() => User, (user) => user.ticketsAtendidos, { nullable: true })
  responsavel?: User;

  @Column()
  categoryId!: string;

  @ManyToOne(() => Category, (cat) => cat.tickets)
  category!: Category;

  @Column({ nullable: true })
  subCategoryId?: string;

  @ManyToOne(() => SubCategory, (sub) => sub.tickets, { nullable: true })
  subCategory?: SubCategory;

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

  @ManyToOne(() => Equipment, (eq) => eq.tickets, { onDelete: "SET NULL", nullable: true })
  equipment?: Equipment;

  @OneToMany(() => TicketMessage, (msg) => msg.ticket)
  messages!: TicketMessage[];

  @OneToMany(() => TicketAttachment, (attach) => attach.ticket)
  attachments!: TicketAttachment[];

  @OneToMany(() => TicketHistory, (hist) => hist.ticket)
  history!: TicketHistory[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
