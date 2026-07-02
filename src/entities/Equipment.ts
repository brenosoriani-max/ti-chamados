import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { Ticket } from "./Ticket";

@Entity("equipments")
export class Equipment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: true })
  patrimony?: string;

  @Column({ type: "varchar", length: 255 })
  machineName!: string;

  @Column({ type: "varchar", length: 255 })
  hostname!: string;

  @Column({ type: "varchar", length: 45 })
  ipAddress!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  currentUser?: string;

  @Column({ type: "varchar", length: 100 })
  operatingSystem!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  windowsVersion?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  processor?: string;

  @Column({ type: "int", nullable: true })
  ramGb?: number;

  @Column({ type: "int", nullable: true })
  diskSpaceGb?: number;

  @Column({ type: "timestamp", nullable: true })
  lastUpdateAt?: Date;

  @Column({ type: "timestamp", nullable: true })
  lastCommunication?: Date;

  @Column({ type: "boolean", default: false })
  isOnline!: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  status?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  departmentId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  responsibleUserId?: string;

  @OneToMany(() => Ticket, (ticket) => ticket.equipment)
  tickets!: Relation<Ticket>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
