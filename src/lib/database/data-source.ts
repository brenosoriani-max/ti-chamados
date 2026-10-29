import { BackupLog } from "@/entities/BackupLog";
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
import { TicketMessageRead } from "@/entities/TicketMessageRead";
import { User } from "@/entities/User";

/**
 * DataSource para CLI do TypeORM (migrations).
 * Em runtime use `initializeDatabase` / `getRepository` de `./index`.
 */
export { AppDataSource, initializeDatabase, getRepository, getDataSource } from "./index";

const ENTITIES = [
  BackupLog,
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
  TicketMessageRead,
  User,
] as const;
