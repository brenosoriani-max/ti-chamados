import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import { TicketMessage } from "./TicketMessage";
import { User } from "./User";

@Entity("ticket_message_reads")
export class TicketMessageRead {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  messageId!: string;

  @ManyToOne(() => TicketMessage, { onDelete: "CASCADE" })
  message!: Relation<TicketMessage>;

  @Column({ type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => User)
  user!: Relation<User>;

  @CreateDateColumn()
  readAt!: Date;
}
