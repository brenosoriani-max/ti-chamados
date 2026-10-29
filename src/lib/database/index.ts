import "reflect-metadata";
import { DataSource, type EntityTarget, type ObjectLiteral, type Repository } from "typeorm";
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
import { User } from "@/entities/User";

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
  User,
] as const;

type DbGlobal = {
  dataSource: DataSource | null;
  initPromise: Promise<DataSource> | null;
};

const g = globalThis as unknown as { __tiChamadosTypeOrm?: DbGlobal };

function state(): DbGlobal {
  if (!g.__tiChamadosTypeOrm) {
    g.__tiChamadosTypeOrm = { dataSource: null, initPromise: null };
  }
  return g.__tiChamadosTypeOrm;
}

function createDataSource() {
  return new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ti_chamados",
    synchronize: false,
    logging: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
    extra: {
      connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
      waitForConnections: true,
      queueLimit: 0,
    },
    entities: [...ENTITIES],
    subscribers: [],
    migrations: [],
  });
}

export function getDataSource(): DataSource {
  const s = state();
  if (!s.dataSource) {
    s.dataSource = createDataSource();
  }
  return s.dataSource;
}

export async function initializeDatabase(): Promise<DataSource> {
  const s = state();
  const ds = getDataSource();

  if (ds.isInitialized) {
    return ds;
  }

  if (s.initPromise) {
    return s.initPromise;
  }

  s.initPromise = (async () => {
    try {
      await ds.initialize();
      await ensureTerminalSchema(ds);
      await ensureFeatureSchema(ds);
      await ensureTicketHistorySchema(ds);
      if (ds.entityMetadatas.length === 0) {
        throw new Error("TypeORM inicializou sem metadados de entidades.");
      }
      console.log(`Banco de dados conectado (${ds.entityMetadatas.length} entidades).`);
      return ds;
    } catch (error) {
      s.initPromise = null;
      try {
        if (ds.isInitialized) await ds.destroy();
      } catch {
        /* ignore */
      }
      s.dataSource = null;
      console.error("Não foi possível conectar ao banco de dados.", error);
      throw error;
    }
  })();

  return s.initPromise;
}

async function ensureTerminalSchema(source: DataSource) {
  const qr = source.createQueryRunner();
  try {
    await qr.connect();
    const tables: Array<{ [k: string]: string }> = await qr.query("SHOW TABLES LIKE 'terminals'");
    if (!tables.length) return;

    const columns: Array<{ Field: string; Type: string }> = await qr.query("SHOW COLUMNS FROM terminals");
    const byName = new Map(columns.map((c) => [c.Field, c.Type.toLowerCase()]));

    if (!byName.has("userId")) {
      await qr.query("ALTER TABLE terminals ADD COLUMN userId VARCHAR(36) NULL");
      try {
        await qr.query("CREATE INDEX IDX_terminals_userId ON terminals (userId)");
      } catch {
        /* index may exist */
      }
    }

    // Um terminal de sessão web pertence a apenas um usuário. O índice
    // único também evita duplicidade quando dois logins chegam ao mesmo tempo.
    const indexes: Array<{ Key_name: string }> = await qr.query("SHOW INDEX FROM terminals");
    if (!indexes.some((index) => index.Key_name === "UQ_terminals_userId")) {
      try {
        await qr.query("CREATE UNIQUE INDEX UQ_terminals_userId ON terminals (userId)");
      } catch (error) {
        console.warn(
          "Não foi possível criar a restrição única de terminais por usuário:",
          error instanceof Error ? error.message : error
        );
      }
    }

    if (!byName.has("equipmentUuid")) {
      await qr.query("ALTER TABLE terminals ADD COLUMN equipmentUuid VARCHAR(191) NULL");
    } else if (!byName.get("equipmentUuid")!.includes("191")) {
      await qr.query("ALTER TABLE terminals MODIFY equipmentUuid VARCHAR(191) NULL");
    }

    for (const col of [
      ["hostname", "VARCHAR(255) NULL"],
      ["windowsVersion", "VARCHAR(100) NULL"],
      ["arquitetura", "VARCHAR(50) NULL"],
      ["memoriaRamGb", "INT NULL"],
      ["processador", "VARCHAR(255) NULL"],
      ["usuarioLogado", "VARCHAR(255) NULL"],
      ["resolucaoTela", "VARCHAR(50) NULL"],
      ["quantidadeMonitores", "INT NULL"],
    ] as const) {
      if (!byName.has(col[0])) {
        await qr.query(`ALTER TABLE terminals ADD COLUMN ${col[0]} ${col[1]}`);
      }
    }
  } catch (error) {
    console.warn(
      "Ajuste de schema de terminals ignorado:",
      error instanceof Error ? error.message : error
    );
  } finally {
    await qr.release();
  }
}

async function ensureFeatureSchema(source: DataSource) {
  const qr = source.createQueryRunner();
  try {
    await qr.connect();

    const ticketTables: Array<{ [k: string]: string }> = await qr.query("SHOW TABLES LIKE 'tickets'");
    if (ticketTables.length) {
      const columns: Array<{ Field: string }> = await qr.query("SHOW COLUMNS FROM tickets");
      const names = new Set(columns.map((column) => column.Field));
      const ticketColumns: Array<[string, string]> = [
        ["conclusaoAtendimento", "TEXT NULL"],
        ["transferredFromUserId", "VARCHAR(36) NULL"],
        ["transferredToUserId", "VARCHAR(36) NULL"],
        ["transferReason", "VARCHAR(255) NULL"],
        ["backupNotes", "TEXT NULL"],
      ];
      for (const [name, definition] of ticketColumns) {
        if (!names.has(name)) {
          await qr.query(`ALTER TABLE tickets ADD COLUMN ${name} ${definition}`);
        }
      }
      if (names.has("transferReason")) {
        await qr.query("ALTER TABLE tickets MODIFY transferReason VARCHAR(255) NULL");
      }
    }

    const knowledgeTables: Array<{ [k: string]: string }> = await qr.query("SHOW TABLES LIKE 'knowledge_articles'");
    if (!knowledgeTables.length) {
      await qr.query(`
        CREATE TABLE knowledge_articles (
          id VARCHAR(36) NOT NULL,
          title VARCHAR(255) NOT NULL,
          content LONGTEXT NOT NULL,
          tags VARCHAR(255) NULL,
          categoryId VARCHAR(36) NULL,
          createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (id),
          INDEX IDX_knowledge_articles_categoryId (categoryId)
        )
      `);
    }

    const backupTables: Array<{ [k: string]: string }> = await qr.query("SHOW TABLES LIKE 'backup_logs'");
    if (!backupTables.length) {
      await qr.query(`
        CREATE TABLE backup_logs (
          id VARCHAR(36) NOT NULL,
          triggeredById VARCHAR(36) NULL,
          status ENUM('SUCESSO','ERRO','EM_ANDAMENTO') NOT NULL DEFAULT 'EM_ANDAMENTO',
          filePath VARCHAR(500) NULL,
          fileSizeBytes BIGINT NULL,
          errorMessage TEXT NULL,
          durationMs INT NULL,
          backupType VARCHAR(50) NULL,
          createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          PRIMARY KEY (id)
        )
      `);
    }
  } catch (error) {
    console.warn(
      "Ajuste de schema de recursos ignorado:",
      error instanceof Error ? error.message : error
    );
  } finally {
    await qr.release();
  }
}

async function ensureTicketHistorySchema(source: DataSource) {
  const qr = source.createQueryRunner();
  try {
    await qr.connect();
    const tables: Array<{ [k: string]: string }> = await qr.query("SHOW TABLES LIKE 'ticket_histories'");
    if (!tables.length) return;

    const columns: Array<{ Field: string; Type: string }> = await qr.query("SHOW COLUMNS FROM ticket_histories");
    const byName = new Map(columns.map((c) => [c.Field, c.Type.toLowerCase()]));

    if (byName.get("action") && !byName.get("action")!.includes("varchar")) {
      await qr.query("ALTER TABLE ticket_histories MODIFY action VARCHAR(255) NOT NULL");
    } else if (byName.get("action") && byName.get("action")!.includes("varchar") && !byName.get("action")!.includes("255")) {
      await qr.query("ALTER TABLE ticket_histories MODIFY action VARCHAR(255) NOT NULL");
    }
  } catch (error) {
    console.warn(
      "Ajuste de schema de ticket_histories ignorado:",
      error instanceof Error ? error.message : error
    );
  } finally {
    await qr.release();
  }
}

/**
 * Resolve o repositório pelo nome da entidade para evitar
 * EntityMetadataNotFoundError com classes duplicadas no bundle do Next.js.
 */
export function getRepository<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
  const ds = getDataSource();
  if (!ds.isInitialized) {
    throw new Error("Banco de dados ainda não está pronto. Tente novamente.");
  }

  if (typeof entity === "function") {
    const name = (entity as Function).name;
    const meta = ds.entityMetadatas.find(
      (m) => m.target === entity || m.name === name || (typeof m.target === "function" && m.target.name === name)
    );
    if (meta) {
      return ds.getRepository(meta.target as EntityTarget<T>);
    }
  }

  return ds.getRepository(entity);
}

/** Sempre aponta para a instância viva do singleton (globalThis). */
export const AppDataSource = new Proxy({} as DataSource, {
  get(_target, prop, receiver) {
    const ds = getDataSource();
    const value = Reflect.get(ds as object, prop, receiver);
    return typeof value === "function" ? (value as Function).bind(ds) : value;
  },
});
