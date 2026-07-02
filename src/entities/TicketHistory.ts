import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import { Ticket } from "./Ticket";
import { User } from "./User";
import { HistoryAction } from "../types";

@Entity("ticket_histories")
export class TicketHistory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  ticketId!: string;

  @ManyToOne(() => Ticket, (t) => t.history, { onDelete: "CASCADE" })
  ticket!: Relation<Ticket>;

  @Column({ type: "varchar", length: 36, nullable: true })
  actorId?: string;

  @ManyToOne(() => User, (u) => u.histories, { onDelete: "SET NULL", nullable: true })
  actor?: Relation<User>;

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
  metadata?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
