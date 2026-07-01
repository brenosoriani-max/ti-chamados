import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Category } from "./Category";

@Entity("knowledge_articles")
export class KnowledgeArticle {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "longtext" })
  content!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  tags?: string; // Comma separated tags

  @Column({ nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, (cat) => cat.articles, { onDelete: "SET NULL", nullable: true })
  category?: Category;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
