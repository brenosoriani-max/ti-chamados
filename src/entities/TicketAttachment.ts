import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import type { Ticket } from "./Ticket";
import type { TicketMessage } from "./TicketMessage";

@Entity("ticket_attachments")
export class TicketAttachment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  ticketId!: string;

  @ManyToOne("Ticket", (t: any) => t.attachments, { onDelete: "CASCADE" })
  ticket!: Relation<Ticket>;

  @Column({ nullable: true })
  messageId?: string;

  @ManyToOne("TicketMessage", (m: any) => m.attachments, { onDelete: "SET NULL", nullable: true })
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
