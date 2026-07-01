import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { Ticket } from "./Ticket";
import { User } from "./User";
import { HistoryAction } from "../types";

@Entity("ticket_histories")
export class TicketHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  ticketId!: string;

  @ManyToOne(() => Ticket, (t) => t.history, { onDelete: "CASCADE" })
  ticket!: Ticket;

  @Column({ nullable: true })
  actorId?: string;

  @ManyToOne(() => User, (u) => u.histories, { onDelete: "SET NULL", nullable: true })
  actor?: User;

  @Column({
    type: "enum",
    enum: HistoryAction,
  })
  action!: HistoryAction;

  @Column({ type: "text", nullable: true })
  fromValue?: string;

  @Column({ type: "text", nullable: true })
  toValue?: string;

  @Column({ type: "text", nullable: true })
  metadata?: string; // JSON string representation if needed

  @CreateDateColumn()
  createdAt!: Date;
}
