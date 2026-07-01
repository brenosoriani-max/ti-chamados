import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  type Relation,
} from "typeorm";
import type { Category } from "./Category";

@Entity("knowledge_articles")
export class KnowledgeArticle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "longtext" })
  content!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  tags?: string;

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne("Category", (cat: any) => cat.articles, { onDelete: "SET NULL", nullable: true })
  category?: Relation<Category>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
