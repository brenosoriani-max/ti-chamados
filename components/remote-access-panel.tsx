"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

type RemoteSessionItem = {
  id: string;
  sessionId: number;
  userName: string;
  status: string;
  connectionType: string;
  mode: string;
};

type RemoteAccessPanelProps = {
  ticketId: string;
  equipmentId: string;
  host: string;
  ip: string;
  sessions: RemoteSessionItem[];
};

const modes = [
  { value: "shadow", label: "Sombra" },
  { value: "view", label: "Visualizacao" },
  { value: "control", label: "Controle remoto" }
];

export function RemoteAccessPanel({ ticketId, equipmentId, host, ip, sessions }: RemoteAccessPanelProps) {
  const [mode, setMode] = useState("shadow");
  const [sessionId, setSessionId] = useState<string>(sessions[0]?.sessionId?.toString() ?? "0");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/remote-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId,
          host,
          ip,
          sessionId: Number(sessionId) || 0,
          mode,
          connectionType: mode,
          reason: "Acesso remoto solicitado pelo chamado"
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || data.error || "Falha ao enviar requisicao");

      setStatus("Solicitacao de conexao enviada com sucesso.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro desconhecido ao solicitar conexao");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acesso remoto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-sm">
          <p className="font-medium">Fluxo de suporte remoto</p>
          <p className="mt-2 text-xs text-muted-foreground">Escolha a sessão do usuário, selecione o modo de conexão e envie a solicitação para o Agente Desktop.</p>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>Host: <span className="font-medium text-foreground">{host}</span></p>
          <p>IP: <span className="font-medium text-foreground">{ip}</span></p>
          <p>Sessão selecionada: <span className="font-medium text-foreground">{sessionId}</span></p>
        </div>

        {sessions.length > 0 ? (
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Sessao</label>
              <Select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
                {sessions.map((item) => (
                  <option key={item.id} value={item.sessionId}>
                    {item.sessionId} — {item.userName} ({item.status})
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Modo</label>
              <Select value={mode} onChange={(event) => setMode(event.target.value)}>
                {modes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma sessao registrada para esta maquina.</p>
        )}

        <Button onClick={handleConnect} disabled={loading || Number(sessionId) === 0}>
          {loading ? "Enviando..." : "Abrir conexao remota"}
        </Button>

        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </CardContent>
    </Card>
  );
}
