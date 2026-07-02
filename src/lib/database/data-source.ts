import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "@/entities/Category";
import { Equipment } from "@/entities/Equipment";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { Notification } from "@/entities/Notification";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { SLA } from "@/entities/SLA";
import { SubCategory } from "@/entities/SubCategory";
import { Terminal } from "@/entities/Terminal";
import { Ticket } from "@/entities/Ticket";
import { TicketAttachment } from "@/entities/TicketAttachment";
import { TicketHistory } from "@/entities/TicketHistory";
import { TicketMessage } from "@/entities/TicketMessage";
import { User } from "@/entities/User";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ti_chamados",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  entities: [
    Category,
    Equipment,
    KnowledgeArticle,
    Notification,
    SessaoRemota,
    SLA,
    SubCategory,
    Terminal,
    Ticket,
    TicketAttachment,
    TicketHistory,
    TicketMessage,
    User,
  ],
  subscribers: [],
  migrations: [
    "src/lib/database/migrations/**/{.ts,.js}",
  ],
});
