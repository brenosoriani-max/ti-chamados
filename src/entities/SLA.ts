import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Priority } from "../types";

@Entity("slas")
export class SLA {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "enum",
    enum: Priority,
    unique: true,
  })
  priority!: Priority;

  @Column({ type: "int" })
  responseHours!: number;

  @Column({ type: "int" })
  solutionHours!: number;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
