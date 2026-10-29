import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  type Relation,
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
  tags?: string;

  @Column({ type: "varchar", length: 36, nullable: true })
  categoryId?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  attachmentName?: string;

  @Column({ type: "text", nullable: true })
  attachmentUrl?: string;

  @Column({ type: "boolean", default: false })
  isQuickReply!: boolean;

  @ManyToOne(() => Category, (cat) => cat.articles, { onDelete: "SET NULL", nullable: true })
  category?: Relation<Category>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
