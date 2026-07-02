import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { Role } from "../types";
import { Ticket } from "./Ticket";
import { TicketMessage } from "./TicketMessage";
import { TicketHistory } from "./TicketHistory";
import { Notification } from "./Notification";
import { SessaoRemota } from "./SessaoRemota";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 191, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.CLIENTE,
  })
  role!: Role;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatarUrl?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  department?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "varchar", length: 45, nullable: true })
  lastIp?: string;

  @OneToMany(() => Ticket, (ticket) => ticket.cliente)
  ticketsCriados!: Relation<Ticket>[];

  @OneToMany(() => Ticket, (ticket) => ticket.responsavel)
  ticketsAtendidos!: Relation<Ticket>[];

  @OneToMany(() => TicketMessage, (message) => message.author)
  messages!: Relation<TicketMessage>[];

  @OneToMany(() => TicketHistory, (history) => history.actor)
  histories!: Relation<TicketHistory>[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications!: Relation<Notification>[];

  @OneToMany(() => SessaoRemota, (sessao) => sessao.usuario)
  sessoesRemotas!: Relation<SessaoRemota>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
