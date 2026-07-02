import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  type Relation,
} from "typeorm";
import { Category } from "./Category";
import { Ticket } from "./Ticket";

@Entity("subcategories")
@Index(["name", "categoryId"], { unique: true })
export class SubCategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 191 })
  name!: string;

  @Column({ type: "varchar", length: 36 })
  categoryId!: string;

  @ManyToOne(() => Category, (cat) => cat.subCategories, { onDelete: "CASCADE" })
  category!: Relation<Category>;

  @OneToMany(() => Ticket, (ticket) => ticket.subCategory)
  tickets!: Relation<Ticket>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
