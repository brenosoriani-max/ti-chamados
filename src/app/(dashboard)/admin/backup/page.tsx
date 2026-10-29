"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Database,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  Download,
  AlertTriangle,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type BackupLog = {
  id: string;
  status: "SUCESSO" | "ERRO" | "EM_ANDAMENTO";
  filePath: string | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  durationMs: number | null;
  backupType: string;
  createdAt: string;
  triggeredBy: { name: string } | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function StatusIcon({ status }: { status: BackupLog["status"] }) {
  if (status === "SUCESSO") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "ERRO") return <XCircle className="h-4 w-4 text-red-500" />;
  return <RefreshCcw className="h-4 w-4 text-amber-500 animate-spin" />;
}

export default function BackupPage() {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadLogs() {
    try {
      const response = await fetch("/api/admin/backup");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setLogs(data.logs ?? []);
    } catch {
      toast.error("Não foi possível carregar os logs de backup.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  function triggerBackup() {
    startTransition(async () => {
      toast.info("Iniciando backup do banco de dados…");
      try {
        const response = await fetch("/api/admin/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "manual" }),
        });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.error ?? "Erro ao executar backup.");
          await loadLogs();
          return;
        }

        toast.success("Backup concluído com sucesso!");
        await loadLogs();
      } catch {
        toast.error("Falha ao executar o backup. Verifique se mysqldump está disponível.");
        await loadLogs();
      }
    });
  }

  const lastSuccess = logs.find((l) => l.status === "SUCESSO");
  const totalSuccess = logs.filter((l) => l.status === "SUCESSO").length;
  const totalError = logs.filter((l) => l.status === "ERRO").length;

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest leading-none mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Sistema de Backup
        </div>
        <h1 className="text-4xl font-black tracking-tight text-foreground">Backup & Recuperação</h1>
        <p className="text-sm text-muted-foreground font-medium">
          Gerencie backups do banco de dados. O arquivo gerado contém todos os chamados, usuários e histórico.
        </p>
      </header>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Último backup</span>
          </div>
          {lastSuccess ? (
            <>
              <p className="text-lg font-black text-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                  new Date(lastSuccess.createdAt)
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {lastSuccess.fileSizeBytes ? formatBytes(lastSuccess.fileSizeBytes) : "—"}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground font-semibold">Nenhum backup</p>
          )}
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Concluídos</span>
          </div>
          <p className="text-3xl font-black text-emerald-600">{totalSuccess}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2 text-red-500">
            <XCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.14em]">Com erro</span>
          </div>
          <p className="text-3xl font-black text-red-500">{totalError}</p>
        </div>
      </div>

      {/* Action area */}
      <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-black text-foreground">Backup manual</h2>
            <p className="text-sm text-muted-foreground">
              Gera um dump completo do banco de dados MySQL usando{" "}
              <code className="text-xs bg-muted rounded px-1 py-0.5">mysqldump</code>. O arquivo é
              salvo no diretório <code className="text-xs bg-muted rounded px-1 py-0.5">/backups</code>{" "}
              do servidor.
            </p>
          </div>
          <Button
            onClick={triggerBackup}
            disabled={isPending}
            className="gap-2 shrink-0 rounded-xl"
          >
            {isPending ? (
              <RefreshCcw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {isPending ? "Executando…" : "Executar backup"}
          </Button>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Pré-requisito</p>
            <p className="text-xs text-muted-foreground">
              O binário <strong>mysqldump</strong> precisa estar instalado e acessível no PATH do
              servidor. Em ambiente Windows, instale o MySQL Client Tools e garanta que{" "}
              <code className="bg-muted rounded px-1">mysqldump</code> esteja no PATH do sistema.
            </p>
          </div>
        </div>
      </div>

      {/* Logs table */}
      <div className="rounded-3xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="font-black text-sm uppercase tracking-[0.14em] text-foreground">
              Histórico de backups
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadLogs}
            className="gap-2 text-muted-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <Database className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground font-semibold">Nenhum backup registrado.</p>
            <p className="text-xs text-muted-foreground mt-1">Execute o primeiro backup usando o botão acima.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
                <StatusIcon status={log.status} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-[0.14em] ${
                        log.status === "SUCESSO"
                          ? "text-emerald-600"
                          : log.status === "ERRO"
                          ? "text-red-500"
                          : "text-amber-500"
                      }`}
                    >
                      {log.status === "SUCESSO"
                        ? "Concluído"
                        : log.status === "ERRO"
                        ? "Erro"
                        : "Em andamento"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {log.backupType === "manual" ? "Manual" : "Agendado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {log.errorMessage
                      ? log.errorMessage
                      : log.filePath
                      ? `Arquivo: ${log.filePath}`
                      : "—"}
                  </p>
                </div>

                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                      new Date(log.createdAt)
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-end">
                    {log.durationMs != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {formatDuration(log.durationMs)}
                      </span>
                    )}
                    {log.fileSizeBytes != null && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="h-2.5 w-2.5" />
                        {formatBytes(log.fileSizeBytes)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
