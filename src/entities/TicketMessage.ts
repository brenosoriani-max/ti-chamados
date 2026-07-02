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
import { Ticket } from "./Ticket";
import { User } from "./User";
import { TicketAttachment } from "./TicketAttachment";

@Entity("ticket_messages")
export class TicketMessage {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  ticketId!: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: "CASCADE" })
  ticket!: Relation<Ticket>;

  @Column({ type: "varchar", length: 36 })
  authorId!: string;

  @ManyToOne(() => User, (user) => user.messages)
  author!: Relation<User>;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "boolean", default: false })
  isInternal!: boolean;

  @Column({ type: "timestamp", nullable: true })
  editedAt?: Date;

  @OneToMany(() => TicketAttachment, (attach) => attach.message)
  attachments!: Relation<TicketAttachment>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
