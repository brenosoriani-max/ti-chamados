import "reflect-metadata";
import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import { Role, Priority } from "../types";
import { User } from "../entities/User";
import { Category } from "../entities/Category";
import { SubCategory } from "../entities/SubCategory";
import { SLA } from "../entities/SLA";
import { Ticket } from "../entities/Ticket";
import { TicketMessage } from "../entities/TicketMessage";
import { TicketAttachment } from "../entities/TicketAttachment";
import { TicketHistory } from "../entities/TicketHistory";
import { Notification } from "../entities/Notification";
import { KnowledgeArticle } from "../entities/KnowledgeArticle";
import { Terminal } from "../entities/Terminal";
import { SessaoRemota } from "../entities/SessaoRemota";
import { Equipment } from "../entities/Equipment";

const globalForDb = global as unknown as { dataSource?: DataSource };

export const AppDataSource =
  globalForDb.dataSource ||
  new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || "3306"),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "helpdesk_contec",
    entities: [
      User,
      Ticket,
      Category,
      SubCategory,
      SLA,
      TicketMessage,
      TicketAttachment,
      TicketHistory,
      Notification,
      KnowledgeArticle,
      Terminal,
      SessaoRemota,
      Equipment,
    ],
    synchronize: true, // Auto create tables & relationships (perfect for self-healing)
    logging: false,
    extra: {
      connectionLimit: 10,
      connectTimeout: 10000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.dataSource = AppDataSource;
}

export async function getDataSource(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await seedDatabase(AppDataSource);
  }
  return AppDataSource;
}

async function seedDatabase(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const slaRepo = dataSource.getRepository(SLA);
  const categoryRepo = dataSource.getRepository(Category);
  const subCategoryRepo = dataSource.getRepository(SubCategory);

  // Check if users already seeded
  const userCount = await userRepo.count();
  if (userCount === 0) {
    console.log("Seeding default users...");
    const salt = bcrypt.genSaltSync(10);
    const defaultPassword = bcrypt.hashSync("ti123456", salt);

    const usersToCreate = [
      {
        name: "Administrador HelpDesk",
        email: "admin@helpdesk.com",
        passwordHash: defaultPassword,
        role: Role.ADMINISTRADOR,
        isActive: true,
      },
      {
        name: "Supervisor Geral",
        email: "supervisor@helpdesk.com",
        passwordHash: defaultPassword,
        role: Role.SUPERVISOR,
        isActive: true,
      },
      {
        name: "Operador de Suporte",
        email: "operador@helpdesk.com",
        passwordHash: defaultPassword,
        role: Role.OPERADOR,
        isActive: true,
      },
      {
        name: "Cliente Exemplo",
        email: "cliente@helpdesk.com",
        passwordHash: defaultPassword,
        role: Role.CLIENTE,
        isActive: true,
      },
    ];

    for (const u of usersToCreate) {
      const user = userRepo.create(u);
      await userRepo.save(user);
    }
  }

  // Check SLA priority rules
  const slaCount = await slaRepo.count();
  if (slaCount === 0) {
    console.log("Seeding default SLAs...");
    const slasToCreate = [
      { priority: Priority.BAIXA, responseHours: 24, solutionHours: 48, isActive: true },
      { priority: Priority.MEDIA, responseHours: 8, solutionHours: 24, isActive: true },
      { priority: Priority.ALTA, responseHours: 4, solutionHours: 12, isActive: true },
      { priority: Priority.URGENTE, responseHours: 1, solutionHours: 4, isActive: true },
    ];

    for (const s of slasToCreate) {
      const sla = slaRepo.create(s);
      await slaRepo.save(sla);
    }
  }

  // Check Categories and SubCategories
  const categoryCount = await categoryRepo.count();
  if (categoryCount === 0) {
    console.log("Seeding default ticket categories and subcategories...");

    const categoriesWithSubs = [
      {
        name: "Sistemas & Softwares",
        description: "Chamados sobre mau funcionamento, erros ou instalações de aplicativos e ERP.",
        subs: ["Erro no Sistema", "Novos Acessos", "Instalação de Software"],
      },
      {
        name: "Hardware & Equipamentos",
        description: "Problemas físicos em computadores, monitores, mouse, headsets ou impressoras.",
        subs: ["Problema no Monitor", "Troca de Teclado/Mouse", "Computador não liga"],
      },
      {
        name: "Redes & Conectividade",
        description: "Instabilidades com conexão Wi-Fi, cabo de rede, internet e VPN.",
        subs: ["Sem acesso à Internet", "Rede Lenta", "Configuração de VPN"],
      },
      {
        name: "Acessos & Segurança",
        description: "Alteração de credenciais, liberação de pastas ou liberação de crachás.",
        subs: ["Resetar Senha", "Solicitação de Acesso", "Bloqueio/Desbloqueio de Usuário"],
      },
    ];

    for (const catData of categoriesWithSubs) {
      const category = categoryRepo.create({
        name: catData.name,
        description: catData.description,
        isActive: true,
      });
      const savedCategory = await categoryRepo.save(category);

      for (const subName of catData.subs) {
        const sub = subCategoryRepo.create({
          name: subName,
          categoryId: savedCategory.id,
        });
        await subCategoryRepo.save(sub);
      }
    }
  }
}
