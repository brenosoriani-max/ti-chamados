
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import {
  appendFile,
  mkdir,
  stat,
} from "fs/promises";
import { pipeline } from "stream/promises";
import path from "path";

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

let restoreInProgress = false;

const BACKUP_DIR = path.join(process.cwd(), "backups");

function getMysqlConfig() {
  return {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "ti_chamados",
  };
}

/**
 * Gera um backup preventivo do banco.
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
    }
  );

  let stderr = "";

  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  const output = createWriteStream(filePath);

  const outputPromise = pipeline(child.stdout, output);

  const processPromise = new Promise<number>((resolve, reject) => {
    child.once("error", reject);

    child.once("close", (code) => {
      resolve(code ?? -1);
    });
  });

  try {
    const [_, code] = await Promise.all([
      outputPromise,
      processPromise,
    ]);

    if (code !== 0) {
      throw new Error(
        stderr.trim() || `mysqldump finalizou com código ${code}.`
      );
    }
  } catch (error) {
    child.kill();
    throw error;
  }
}

/**
 * Importa um arquivo SQL no MySQL.
 */
async function runMysqlRestore(filePath: string): Promise<void> {
  const db = getMysqlConfig();

  const child = spawn(
    "mysql",
    [
      "-h", db.host,
      "-P", String(db.port),
      "-u", db.user,
      db.database,
    ],
    {
      env: {
        ...process.env,
        MYSQL_PWD: db.password,
      },
      windowsHide: true,
      shell: false,
    }
  );

  let stderr = "";

  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  const input = createReadStream(filePath);

  const inputPromise = pipeline(input, child.stdin);

  const processPromise = new Promise<number>((resolve, reject) => {
    child.once("error", reject);

    child.once("close", (code) => {
      resolve(code ?? -1);
    });
  });

  try {
    const [_, code] = await Promise.all([
      inputPromise,
      processPromise,
    ]);

    if (code !== 0) {
      throw new Error(
        stderr.trim() || `mysql finalizou com código ${code}.`
      );
    }
  } catch (error) {
    child.kill();
    throw error;
  }
}

/**
 * Registra auditoria fora do banco restaurado.
 * O dump pode substituir a tabela backup_logs.
 */
async function writeAudit(data: Record<string, unknown>) {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });

    const auditPath = path.join(
      BACKUP_DIR,
      "restore_audit.jsonl"
    );

    await appendFile(
      auditPath,
      JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }) + "\n",
      "utf8"
    );
  } catch (error) {
    console.error("Falha ao registrar auditoria:", error);
  }
}

/**
 * POST /api/admin/backup/restore
 *
 * Body:
 * {
 *   "backupId": 123,
 *   "confirmation": "RESTAURAR"
 * }
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

  if (restoreInProgress) {
    return NextResponse.json(
      {
        error: "Já existe uma restauração em andamento. Aguarde.",
      },
      { status: 409 }
    );
  }

  restoreInProgress = true;

  let selectedBackupPath: string | null = null;
  let safetyBackupPath: string | null = null;

  const startedAt = Date.now();

  try {
    const body = await request.json();

  
    const confirmation = body.confirmation;

  const backupId = String(body.backupId ?? "").trim();

if (!backupId || backupId.length > 128) {
    return NextResponse.json(
        { error: "ID do backup inválido." },
        { status: 400 }
    );
}

    if (confirmation !== "RESTAURAR") {
      return NextResponse.json(
        {
          error: 'Confirmação inválida. Digite "RESTAURAR".',
        },
        { status: 400 }
      );
    }

    await initializeDatabase();

    const backupRepository = getRepository(BackupLog);

    const backup = await backupRepository.findOne({
      where: {
        id: backupId,
      },
    });

    if (!backup) {
      return NextResponse.json(
        { error: "Backup não encontrado." },
        { status: 404 }
      );
    }

    if (backup.status !== BackupStatus.SUCESSO) {
      return NextResponse.json(
        {
          error: "Somente backups concluídos com sucesso podem ser restaurados.",
        },
        { status: 400 }
      );
    }

    if (!backup.filePath) {
      return NextResponse.json(
        { error: "O backup não possui um caminho de arquivo válido." },
        { status: 400 }
      );
    }

    // Nunca aceita caminhos arbitrários enviados pelo cliente.
    const fileName = path.basename(
      backup.filePath.replace(/\\/g, "/")
    );

    if (
      fileName !== backup.filePath.replace(/\\/g, "/").split("/").pop() ||
      !/^backup_[a-zA-Z0-9_.-]+\.sql$/.test(fileName)
    ) {
      return NextResponse.json(
        { error: "Nome do arquivo de backup inválido." },
        { status: 400 }
      );
    }

    selectedBackupPath = path.resolve(BACKUP_DIR, fileName);

    const resolvedBackupDir = path.resolve(BACKUP_DIR);

    if (
      path.dirname(selectedBackupPath) !== resolvedBackupDir
    ) {
      return NextResponse.json(
        { error: "Caminho de backup inválido." },
        { status: 400 }
      );
    }

    const backupStats = await stat(selectedBackupPath);

    if (!backupStats.isFile() || backupStats.size === 0) {
      return NextResponse.json(
        { error: "O arquivo de backup está vazio ou é inválido." },
        { status: 400 }
      );
    }

    // 1. Gera backup preventivo.
    await mkdir(BACKUP_DIR, { recursive: true });

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

    const safetyFileName = `backup_pre_restore_${timestamp}.sql`;

    safetyBackupPath = path.join(
      BACKUP_DIR,
      safetyFileName
    );

    await runMysqlDump(safetyBackupPath);

    const safetyStats = await stat(safetyBackupPath);

    if (safetyStats.size === 0) {
      throw new Error("O backup preventivo foi gerado vazio.");
    }

    // 2. Executa a restauração.
    try {
      await runMysqlRestore(selectedBackupPath);
    } catch (restoreError) {
      const restoreMessage =
        restoreError instanceof Error
          ? restoreError.message
          : String(restoreError);

      // 3. Tenta recuperar o banco usando o backup preventivo.
      try {
        await runMysqlRestore(safetyBackupPath);

        await writeAudit({
          operation: "RESTORE",
          status: "FALHA_COM_ROLLBACK_SUCESSO",
          userId: session.id,
          backupId,
          backupFile: fileName,
          safetyBackup: safetyFileName,
          error: restoreMessage,
          durationMs: Date.now() - startedAt,
        });

        return NextResponse.json(
          {
            success: false,
            rollback: true,
            message:
              "A restauração falhou. O banco original foi recuperado pelo backup preventivo.",
            error: restoreMessage,
            safetyBackup: safetyFileName,
          },
          { status: 500 }
        );
      } catch (rollbackError) {
        const rollbackMessage =
          rollbackError instanceof Error
            ? rollbackError.message
            : String(rollbackError);

        await writeAudit({
          operation: "RESTORE",
          status: "FALHA_COM_ROLLBACK_FALHA",
          userId: session.id,
          backupId,
          backupFile: fileName,
          safetyBackup: safetyFileName,
          error: restoreMessage,
          rollbackError: rollbackMessage,
          durationMs: Date.now() - startedAt,
        });

        return NextResponse.json(
          {
            success: false,
            rollback: false,
            critical: true,
            message:
              "A restauração falhou e a recuperação automática também falhou. O banco pode estar inconsistente.",
            error: restoreMessage,
            rollbackError: rollbackMessage,
            safetyBackup: safetyFileName,
          },
          { status: 500 }
        );
      }
    }

    // 4. Registra auditoria fora do banco.
    await writeAudit({
      operation: "RESTORE",
      status: "SUCESSO",
      userId: session.id,
      backupId,
      backupFile: fileName,
      safetyBackup: safetyFileName,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      success: true,
      message: "Banco de dados restaurado com sucesso.",
      backup: {
        id: backupId,
        fileName,
        fileSizeBytes: backupStats.size,
      },
      safetyBackup: {
        fileName: safetyFileName,
        fileSizeBytes: safetyStats.size,
      },
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error);

    await writeAudit({
      operation: "RESTORE",
      status: "ERRO",
      userId: session.id,
      error: message,
      durationMs: Date.now() - startedAt,
    });

    console.error("Erro na restauração:", error);

    return NextResponse.json(
      {
        error: "Não foi possível restaurar o banco de dados.",
        details: message,
        safetyBackup: safetyBackupPath
          ? path.basename(safetyBackupPath)
          : null,
      },
      { status: 500 }
    );
  } finally {
    restoreInProgress = false;
  }
}
