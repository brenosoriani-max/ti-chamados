import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import { Ticket } from "./Ticket";
import { TicketMessage } from "./TicketMessage";

@Entity("ticket_attachments")
export class TicketAttachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  ticketId!: string;

  @ManyToOne(() => Ticket, (t) => t.attachments, { onDelete: "CASCADE" })
  ticket!: Relation<Ticket>;

  @Column({ type: "varchar", length: 36, nullable: true })
  messageId?: string;

  @ManyToOne(() => TicketMessage, (m) => m.attachments, { onDelete: "SET NULL", nullable: true })
  message?: Relation<TicketMessage>;

  @Column({ type: "varchar", length: 255 })
  fileName!: string;

  @Column({ type: "text" })
  fileUrl!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  fileType?: string;

  @Column({ type: "int", nullable: true })
  fileSize?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
