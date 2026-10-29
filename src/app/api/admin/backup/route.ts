import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import { createWriteStream } from "fs";
import { mkdir, stat } from "fs/promises";
import path from "path";
import { getRepository, initializeDatabase } from "@/lib/database";
import { BackupLog, BackupStatus } from "@/entities/BackupLog";
import { requireSession } from "@/lib/auth";
import { Role } from "@/types";

function runMysqlDump(filePath: string) {
  const host = process.env.DB_HOST || "localhost";
  const port = process.env.DB_PORT || "3306";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "ti_chamados";

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      "mysqldump",
      [
        "-h",
        host,
        "-P",
        String(port),
        "-u",
        user,
        "--single-transaction",
        "--routines",
        "--triggers",
        "--add-drop-table",
        database,
      ],
      {
        env: { ...process.env, MYSQL_PWD: password },
        windowsHide: true,
      }
    );

    const output = createWriteStream(filePath);
    child.stdout.pipe(output);

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      output.close();
      reject(error);
    });
    child.on("close", (code) => {
      output.close();
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `mysqldump finalizou com código ${code}.`));
    });
  });
}

export async function GET() {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const logs = await getRepository(BackupLog).find({
      relations: ["triggeredBy"],
      order: { createdAt: "DESC" },
      take: 50,
    });

    const serialized = logs.map((log) => ({
      id: log.id,
      status: log.status,
      filePath: log.filePath,
      fileSizeBytes: log.fileSizeBytes ? Number(log.fileSizeBytes) : null,
      errorMessage: log.errorMessage,
      durationMs: log.durationMs,
      backupType: log.backupType ?? "manual",
      createdAt: log.createdAt,
      triggeredBy: log.triggeredBy ? { name: log.triggeredBy.name } : null,
    }));

    return NextResponse.json({ logs: serialized });
  } catch {
    return NextResponse.json({ error: "Não foi possível listar os backups." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const body = await request.json().catch(() => ({}));
    const backupType: string = body.type ?? "manual";

    const backupRepo = getRepository(BackupLog);
    const log = backupRepo.create({
      triggeredById: session.id,
      status: BackupStatus.EM_ANDAMENTO,
      backupType,
    });
    await backupRepo.save(log);

    const backupDir = path.join(process.cwd(), "backups");
    await mkdir(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup_${timestamp}.sql`;
    const filePath = path.join(backupDir, fileName);

    const startTime = Date.now();

    try {
      await runMysqlDump(filePath);

      const fileStats = await stat(filePath);
      const durationMs = Date.now() - startTime;

      log.status = BackupStatus.SUCESSO;
      log.filePath = `/backups/${fileName}`;
      log.fileSizeBytes = fileStats.size;
      log.durationMs = durationMs;
      await backupRepo.save(log);

      return NextResponse.json({
        success: true,
        log: {
          id: log.id,
          status: log.status,
          filePath: log.filePath,
          fileSizeBytes: Number(log.fileSizeBytes),
          durationMs: log.durationMs,
          createdAt: log.createdAt,
          backupType: log.backupType,
        },
      });
    } catch (backupError) {
      const durationMs = Date.now() - startTime;
      log.status = BackupStatus.ERRO;
      log.errorMessage = backupError instanceof Error ? backupError.message : String(backupError);
      log.durationMs = durationMs;
      await backupRepo.save(log);

      return NextResponse.json(
        {
          error: "O backup falhou. Verifique se o mysqldump está instalado e as credenciais do banco.",
          logId: log.id,
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }
}
