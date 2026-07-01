import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  type Relation,
} from "typeorm";
import type { Ticket } from "./Ticket";
import type { User } from "./User";
import type { TicketAttachment } from "./TicketAttachment";

@Entity("ticket_messages")
export class TicketMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  ticketId!: string;

  @ManyToOne("Ticket", (ticket: any) => ticket.messages, { onDelete: "CASCADE" })
  ticket!: Relation<Ticket>;

  @Column()
  authorId!: string;

  @ManyToOne("User", (user: any) => user.messages)
  author!: Relation<User>;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "boolean", default: false })
  isInternal!: boolean;

  @Column({ type: "timestamp", nullable: true })
  editedAt?: Date;

  @OneToMany("TicketAttachment", (attach: any) => attach.message)
  attachments!: Relation<TicketAttachment>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
