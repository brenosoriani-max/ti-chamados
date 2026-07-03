"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Cpu, HardDrive, Monitor, PlugZap, RefreshCw, Search, ShieldPlus, User } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TerminalStatusBadge } from "@/components/terminal-status-badge";
import { formatDateTime } from "@/lib/utils";
import { remoteSocketEvents } from "@/lib/remote/events";

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
};

export function TerminalManager({ initialTerminais }: { initialTerminais: TerminalItem[] }) {
  const [terminais, setTerminais] = useState(initialTerminais);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return terminais;
    return terminais.filter((t) =>
      [t.nome, t.hostname, t.identificador, t.sistemaOperacional, t.ip, t.usuarioLogado]
        .filter(Boolean)
        .some((item) => item!.toLowerCase().includes(value))
    );
  }, [query, terminais]);

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/terminais?pageSize=100", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setTerminais(data.terminais ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let socket: Socket | null = null;
    (async () => {
      const response = await fetch("/api/auth/socket-token");
      if (!response.ok) return;
      const { token } = await response.json();
      socket = io({ auth: { sessionToken: token, role: "technician" } });
      socket.on(remoteSocketEvents.terminalUpdated, (payload: Partial<TerminalItem> & { id: string }) => {
        setTerminais((prev) => {
          const index = prev.findIndex((t) => t.id === payload.id);
          if (index === -1) {
            refresh();
            return prev;
          }
          const next = [...prev];
          next[index] = { ...next[index], ...payload };
          return next;
        });
      });
    })();
    const id = window.setInterval(refresh, 30_000);
    return () => {
      window.clearInterval(id);
      socket?.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar terminal" className="pl-9" />
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading} className="gap-2">
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} /> Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((terminal) => {
          const activeUser = terminal.sessoesRemotas?.[0]?.usuario?.name;
          return (
            <Card key={terminal.id} className="border border-border/40 shadow-sm">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="mb-2 flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-primary" />
                      <h2 className="truncate text-sm font-bold">{terminal.nome}</h2>
                    </div>
                    <p className="truncate text-[11px] font-medium text-muted-foreground">{terminal.hostname ?? terminal.identificador}</p>
                  </div>
                  <TerminalStatusBadge status={terminal.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Info label="SO" value={terminal.sistemaOperacional ?? "-"} icon={HardDrive} />
                  <Info label="Agente" value={terminal.versaoAgente ? `v${terminal.versaoAgente}` : "-"} />
                  <Info label="IP" value={terminal.ip ?? "-"} />
                  <Info label="Usuario" value={terminal.usuarioLogado ?? "-"} icon={User} />
                  <Info label="CPU" value={terminal.processador ?? "-"} icon={Cpu} />
                  <Info label="RAM" value={terminal.memoriaRamGb ? `${terminal.memoriaRamGb} GB` : "-"} />
                  <Info label="Monitores" value={terminal.quantidadeMonitores ? String(terminal.quantidadeMonitores) : "-"} />
                  <Info label="Ultima conexao" value={terminal.ultimaConexao ? formatDateTime(terminal.ultimaConexao) : "Nunca"} />
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-border/30 pt-4">
                  <p className="truncate text-xs text-muted-foreground">{activeUser ? `Sessao: ${activeUser}` : "Disponivel"}</p>
                  {terminal.status === "ONLINE" ? (
                    <Button asChild className="gap-2"><Link href={`/terminais/${terminal.id}/remoto`}><PlugZap className="h-4 w-4" />Conectar</Link></Button>
                  ) : (
                    <Button disabled className="gap-2"><PlugZap className="h-4 w-4" />Conectar</Button>
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
          <p className="mt-1 text-xs text-muted-foreground">Instale o agente Electron para cadastro automatico.</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Monitor }) {
  return (
    <div className="rounded-md bg-muted/30 p-3">
      <p className="mb-1 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {Icon ? <Icon className="h-3 w-3" /> : null}{label}
      </p>
      <p className="truncate font-semibold">{value}</p>
    </div>
  );
}
