"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Cpu, HardDrive, Monitor, PlugZap, RefreshCw, Search, ShieldPlus, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TerminalStatusBadge } from "@/components/terminal-status-badge";
import { formatDateTime } from "@/lib/utils";

type TerminalItem = {
  id: string;
  nome: string;
  descricao?: string | null;
  identificador: string;
  status: "ONLINE" | "OFFLINE";
  ultimaConexao?: string | null;
  sistemaOperacional?: string | null;
  hostname?: string | null;
  ip?: string | null;
  versaoAgente?: string | null;
  usuarioLogado?: string | null;
  processador?: string | null;
  memoriaRamGb?: number | null;
  quantidadeMonitores?: number | null;
  empresaId?: string | null;
  sessoesRemotas?: Array<{ usuario?: { name: string } | null; status: string }>;
  user?: string | null;
  os?: string | null;
  online?: boolean;
};

export function TerminalManager({ initialTerminais }: { initialTerminais: TerminalItem[] }) {
  const [terminais, setTerminais] = useState<TerminalItem[]>(initialTerminais ?? []);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return terminais;
    return terminais.filter((t) =>
      [t.nome, t.hostname, t.identificador, t.sistemaOperacional, t.ip, t.usuarioLogado, t.user, t.os]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value))
    );
  }, [query, terminais]);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/meshcentral/devices", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Não foi possível carregar dispositivos do MeshCentral.");

      const devices = (data?.devices ?? []).map((device: Record<string, unknown>, index: number) => {
        const raw = device as Record<string, any>;
        const userList = Array.isArray(raw.users) ? (raw.users as string[]) : [];

        return {
          id: String(raw.id ?? raw._id ?? `mesh-device-${index}`),
          nome: String(raw.name ?? raw.hostname ?? raw.computername ?? "Dispositivo"),
          identificador: String(raw.id ?? raw._id ?? raw.name ?? `mesh-device-${index}`),
          hostname: String(raw.hostname ?? raw.computername ?? raw.name ?? "-"),
          sistemaOperacional: String(raw.osdesc ?? raw.os ?? "-"),
          usuarioLogado: String(raw.user ?? raw.username ?? userList[0] ?? "-"),
          user: String(raw.user ?? raw.username ?? userList[0] ?? null),
          os: String(raw.osdesc ?? raw.os ?? null),
          status: Boolean(raw.online ?? raw.conn ?? raw.connected) ? "ONLINE" : "OFFLINE",
          online: Boolean(raw.online ?? raw.conn ?? raw.connected),
          ip: typeof raw.ip === "string" ? raw.ip : null,
          ultimaConexao: typeof raw.lastSeen === "string" ? raw.lastSeen : null,
          versaoAgente: typeof raw.version === "string" ? raw.version : null,
          processador: null,
          memoriaRamGb: null,
          quantidadeMonitores: null,
        };
      });

      setTerminais(devices);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar dispositivos do MeshCentral.");
    } finally {
      setLoading(false);
    }
  }

  async function openRemoteSession(terminal: TerminalItem) {
    if (!terminal.id) return;

    setOpeningId(terminal.id);
    try {
      const response = await fetch("/api/meshcentral/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: terminal.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível abrir a sessão remota.");
      }

      if (data?.sessionUrl) {
        window.open(data.sessionUrl, "_blank", "noopener,noreferrer");
        return;
      }

      if (data?.route) {
        window.location.href = data.route;
        return;
      }

      throw new Error("Resposta inválida do provedor de sessão remota.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir a sessão remota.");
    } finally {
      setOpeningId(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar terminal" className="pl-9" />
        </div>
        <Button variant="outline" onClick={() => void refresh()} disabled={loading} className="gap-2">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((terminal) => {
          const isDeleting = false;
          const isOnline = terminal.online ?? terminal.status === "ONLINE";
          const infoItems = [
            { label: "SO", value: terminal.sistemaOperacional ?? "", icon: HardDrive },
            { label: "Usuário", value: terminal.usuarioLogado ?? terminal.user ?? "", icon: User },
            { label: "IP", value: terminal.ip ?? "" },
            { label: "Agente", value: terminal.versaoAgente ? `v${terminal.versaoAgente}` : "" },
            { label: "CPU", value: terminal.processador ?? "", icon: Cpu },
            { label: "RAM", value: terminal.memoriaRamGb ? `${terminal.memoriaRamGb} GB` : "" },
            { label: "Monitores", value: terminal.quantidadeMonitores ? String(terminal.quantidadeMonitores) : "" },
            { label: "Últ. conexão", value: terminal.ultimaConexao ? formatDateTime(terminal.ultimaConexao) : "" },
          ].filter((item) => item.value && String(item.value).trim().length > 0);

          return (
            <Card
              key={terminal.id}
              className="overflow-hidden border border-slate-200 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)]"
            >
              <div className={`h-1.5 w-full ${isOnline ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-slate-300 to-slate-400"}`} />
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isOnline ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      <Monitor className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-bold text-slate-800">{terminal.nome}</h2>
                      <p className="truncate text-[11px] font-medium text-slate-500">{terminal.hostname ?? terminal.identificador}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TerminalStatusBadge status={isOnline ? "ONLINE" : "OFFLINE"} />
                  </div>
                </div>

                {infoItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {infoItems.map((item) => (
                      <Info key={`${terminal.id}-${item.label}`} label={item.label} value={String(item.value)} icon={item.icon as typeof Monitor | undefined} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-[11px] font-medium text-slate-500">
                    Sem informações adicionais
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-500">{isOnline ? "Disponível" : "Offline"}</p>
                  {isOnline ? (
                    <Button
                      onClick={() => void openRemoteSession(terminal)}
                      disabled={openingId === terminal.id}
                      className="gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold shadow-sm hover:from-blue-500 hover:to-blue-400"
                    >
                      <PlugZap className="h-4 w-4" />
                      {openingId === terminal.id ? "Abrindo..." : "Conectar"}
                    </Button>
                  ) : (
                    <Button disabled className="gap-2 rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-400">
                      <PlugZap className="h-4 w-4" />Conectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center">
          <ShieldPlus className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-bold">Nenhum terminal encontrado</p>
          <p className="mt-1 text-xs text-muted-foreground">Nenhum dispositivo online foi encontrado no MeshCentral.</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Monitor }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
      <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-500">
        {Icon ? <Icon className="h-3 w-3" /> : null}{label}
      </p>
      <p className="truncate text-[11px] font-semibold text-slate-700">{value}</p>
    </div>
  );
}
