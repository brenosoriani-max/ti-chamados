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
import { SubCategory } from "./SubCategory";
import { Ticket } from "./Ticket";
import { KnowledgeArticle } from "./KnowledgeArticle";

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

  @OneToMany(() => SubCategory, (sub) => sub.category)
  subCategories!: Relation<SubCategory>[];

  @OneToMany(() => Ticket, (ticket) => ticket.category)
  tickets!: Relation<Ticket>[];

  @OneToMany(() => KnowledgeArticle, (article) => article.category)
  articles!: Relation<KnowledgeArticle>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
