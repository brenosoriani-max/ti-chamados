"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Expand, Keyboard, MonitorUp, MousePointer2, RefreshCw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerminalStatusBadge } from "@/components/terminal-status-badge";
import { defaultRtcConfiguration } from "@/lib/remote/events";

type Terminal = {
  id: string;
  nome: string;
  status: string;
  sistemaOperacional?: string | null;
};

type RemoteSessionViewerProps = {
  terminal: Terminal;
};

export function RemoteSessionViewer({ terminal }: RemoteSessionViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [status, setStatus] = useState("Pronto");
  const [latency, setLatency] = useState<number | null>(null);

  async function startSession() {
    setStatus("Criando sessao");
    const response = await fetch("/api/remoto/iniciar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terminalId: terminal.id }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error ?? "Falha ao iniciar");
      return;
    }

    setSessaoId(data.id);
    setStatus("Aguardando agente");

    peerRef.current?.close();
    peerRef.current = new RTCPeerConnection(defaultRtcConfiguration);
    peerRef.current.ontrack = (event) => {
      if (videoRef.current) videoRef.current.srcObject = event.streams[0];
      setStatus("Ativa");
    };
  }

  async function endSession() {
    if (!sessaoId) return;
    await fetch("/api/remoto/encerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessaoId }),
    });
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSessaoId(null);
    setStatus("Encerrada");
  }

  function fullscreen() {
    videoRef.current?.requestFullscreen();
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.download = `sessao-${terminal.nome}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const start = performance.now();
      fetch("/api/remoto/sessoes?terminalId=" + terminal.id, { cache: "no-store" })
        .then(() => setLatency(Math.round(performance.now() - start)))
        .catch(() => setLatency(null));
    }, 4000);

    return () => {
      window.clearInterval(id);
      peerRef.current?.close();
    };
  }, [terminal.id]);

  return (
    <div className="min-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <MonitorUp className="h-5 w-5 text-primary" />
            <h1 className="truncate text-sm font-bold">{terminal.nome}</h1>
            <TerminalStatusBadge status={terminal.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Sessao: <span className="font-semibold text-foreground">{status}</span>
            {latency !== null ? ` | Latencia ${latency}ms` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!sessaoId ? (
            <Button onClick={startSession} disabled={terminal.status !== "ONLINE"} className="gap-2">
              <MonitorUp className="h-4 w-4" />
              Iniciar
            </Button>
          ) : (
            <Button variant="destructive" onClick={endSession} className="gap-2">
              <Square className="h-4 w-4" />
              Encerrar sessão
            </Button>
          )}
          <Button variant="outline" size="icon" title="Tela cheia" onClick={fullscreen}>
            <Expand className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Atualizar" onClick={startSession}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Capturar imagem" onClick={capture}>
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid min-h-[620px] grid-rows-[1fr_auto] bg-black">
        <div className="relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full max-h-[calc(100vh-15rem)] w-full object-contain"
          />
          {!sessaoId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-center text-white">
              <div>
                <MonitorUp className="mx-auto mb-4 h-10 w-10 opacity-70" />
                <p className="text-sm font-bold">Nenhuma sessão ativa</p>
                <p className="mt-1 text-xs text-white/60">Inicie uma sessão para receber o stream WebRTC do agente.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-zinc-950 px-4 py-3 text-white">
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            Ctrl+Alt+Del
          </Button>
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            Transferência de arquivos
          </Button>
          <Button variant="outline" size="icon" title="Mouse">
            <MousePointer2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Teclado">
            <Keyboard className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
