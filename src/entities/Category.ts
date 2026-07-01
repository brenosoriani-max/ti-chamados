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
import type { SubCategory } from "./SubCategory";
import type { Ticket } from "./Ticket";
import type { KnowledgeArticle } from "./KnowledgeArticle";

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 191, unique: true })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @OneToMany("SubCategory", (sub: any) => sub.category)
  subCategories!: Relation<SubCategory>[];

  @OneToMany("Ticket", (ticket: any) => ticket.category)
  tickets!: Relation<Ticket>[];

  @OneToMany("KnowledgeArticle", (article: any) => article.category)
  articles!: Relation<KnowledgeArticle>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
