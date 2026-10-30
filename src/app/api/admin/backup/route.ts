
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { mkdir, stat, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import {
  getRepository,
  initializeDatabase,
} from "@/lib/database";

import {
  BackupLog,
  BackupStatus,
} from "@/entities/BackupLog";

import { requireSession } from "@/lib/auth";
import { Role } from "@/types";

export const runtime = "nodejs";

const BACKUP_DIR = path.join(process.cwd(), "backups");
const BACKUP_TIMEOUT = 120_000;

function getMysqlConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "helpdesk_contec",
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : String(error);
}

/**
 * Executa o mysqldump e aguarda:
 * 1. Encerramento do processo.
 * 2. Finalização da gravação do arquivo.
 */
async function runMysqlDump(filePath: string): Promise<void> {
  const db = getMysqlConfig();

  const child = spawn(
    "mysqldump",
    [
      "-h", db.host,
      "-P", String(db.port),
      "-u", db.user,
      "--single-transaction",
      "--routines",
      "--triggers",
      "--add-drop-table",
      db.database,
    ],
    {
      env: {
        ...process.env,
        MYSQL_PWD: db.password,
      },
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let stderr = "";
  let timedOut = false;

  child.stderr?.on("data", (chunk) => {
    stderr += String(chunk);

    // Evita acumular uma quantidade ilimitada de mensagens.
    if (stderr.length > 20_000) {
      stderr = stderr.slice(-20_000);
    }
  });

  const processPromise = new Promise<number>((resolve, reject) => {
    child.once("error", reject);

    child.once("close", (code) => {
      resolve(code ?? -1);
    });
  });

  if (!child.stdout) {
    child.kill();
    throw new Error("Não foi possível acessar a saída do mysqldump.");
  }

  const outputPromise = import("stream/promises").then(({ pipeline }) =>
    pipeline(
      child.stdout!,
      createWriteStream(filePath, { flags: "wx" })
    )
  );

  const timeout = setTimeout(() => {
    timedOut = true;
    child.kill();
  }, BACKUP_TIMEOUT);

  try {
    const results = await Promise.all([
      outputPromise,
      processPromise,
    ]);

    const exitCode = results[1];

    if (timedOut) {
      throw new Error(
        "O mysqldump ultrapassou o limite de 120 segundos."
      );
    }

    if (exitCode !== 0) {
      throw new Error(
        stderr.trim() ||
        `mysqldump finalizou com código ${exitCode}.`
      );
    }
  } catch (error) {
    child.kill();

    await Promise.allSettled([
      outputPromise,
      processPromise,
    ]);

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * GET /api/admin/backup
 * Lista os backups registrados.
 */
export async function GET() {
  try {
    await requireSession([Role.ADMIN]);
  } catch {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 403 }
    );
  }

  try {
    await initializeDatabase();

    const logs = await getRepository(BackupLog).find({
      relations: ["triggeredBy"],
      order: {
        createdAt: "DESC",
      },
      take: 50,
    });

    const serialized = logs.map((log) => ({
      id: log.id,
      status: log.status,
      filePath: log.filePath ?? null,
      fileSizeBytes:
        log.fileSizeBytes != null
          ? Number(log.fileSizeBytes)
          : null,
      errorMessage: log.errorMessage ?? null,
      durationMs: log.durationMs ?? null,
      backupType: log.backupType ?? "manual",
      createdAt: log.createdAt,
      triggeredBy: log.triggeredBy
        ? { name: log.triggeredBy.name }
        : null,
    }));

    return NextResponse.json({
      logs: serialized,
    });
  } catch (error) {
    console.error("Erro ao listar backups:", error);

    return NextResponse.json(
      { error: "Não foi possível listar os backups." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/backup
 * Executa um novo backup.
 */
export async function POST(request: NextRequest) {
  let session: Awaited<ReturnType<typeof requireSession>>;

  try {
    session = await requireSession([Role.ADMIN]);
  } catch {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: 403 }
    );
  }

  let log: BackupLog | null = null;
  let filePath: string | null = null;

  const startedAt = Date.now();

  try {
    await initializeDatabase();

    const body = await request.json().catch(() => ({}));

    const backupType =
      typeof body.type === "string"
        ? body.type
        : "manual";

    const backupRepository = getRepository(BackupLog);

    // 1. Registra o início da operação.
    log = backupRepository.create({
      triggeredById: session.id,
      status: BackupStatus.EM_ANDAMENTO,
      backupType,
    });

    await backupRepository.save(log);

    // 2. Toda a execução posterior fica protegida pelo try/catch.
    await mkdir(BACKUP_DIR, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const fileName = `backup_${timestamp}_${randomUUID()}.sql`;

    filePath = path.join(BACKUP_DIR, fileName);

    // 3. Executa o dump.
    await runMysqlDump(filePath);

    // 4. Valida o arquivo gerado.
    const fileStats = await stat(filePath);

    if (!fileStats.isFile() || fileStats.size === 0) {
      throw new Error(
        "O mysqldump terminou, mas o arquivo gerado está vazio ou inválido."
      );
    }

    // 5. Atualiza o registro.
    log.status = BackupStatus.SUCESSO;
    log.filePath = `/backups/${fileName}`;
    log.fileSizeBytes = fileStats.size;
    log.durationMs = Date.now() - startedAt;
    log.errorMessage = undefined;

    await backupRepository.save(log);

    console.info("Backup concluído:", {
      id: log.id,
      fileName,
      size: fileStats.size,
      durationMs: log.durationMs,
    });

    return NextResponse.json({
      success: true,
      message: "Backup concluído com sucesso.",
      log: {
        id: log.id,
        status: log.status,
        filePath: log.filePath,
        fileSizeBytes: fileStats.size,
        durationMs: log.durationMs,
        createdAt: log.createdAt,
        backupType: log.backupType,
      },
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Erro ao executar backup:", error);

    // Remove eventual arquivo incompleto.
    if (filePath) {
      try {
        await unlink(filePath);
      } catch {
        // O arquivo pode não ter sido criado.
      }
    }

    // Se o registro já foi criado, registra a falha.
    if (log) {
      try {
        log.status = BackupStatus.ERRO;
        log.errorMessage = message;
        log.durationMs = Date.now() - startedAt;

        await getRepository(BackupLog).save(log);
      } catch (saveError) {
        console.error(
          "Não foi possível atualizar o registro do backup:",
          saveError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "O backup não pôde ser concluído.",
        details: message,
        logId: log?.id ?? null,
      },
      { status: 500 }
    );
  }
}
