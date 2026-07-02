import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import { User } from "./User";
import { NotificationType } from "../types";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 36 })
  userId!: string;

  @ManyToOne(() => User, (u) => u.notifications, { onDelete: "CASCADE" })
  user!: Relation<User>;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.INTERNA,
  })
  type!: NotificationType;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ type: "timestamp", nullable: true })
  readAt?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  ticketId?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
