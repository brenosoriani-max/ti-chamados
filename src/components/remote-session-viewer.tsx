"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Expand, Keyboard, MonitorUp, RefreshCw, Square, ZoomIn, ZoomOut } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { TerminalStatusBadge } from "@/components/terminal-status-badge";
import { defaultRtcConfiguration, remoteSocketEvents } from "@/lib/remote/events";
import { messages, sessionStatusLabel, readApiError } from "@/lib/messages";
import { toast } from "sonner";

type Terminal = {
  id: string;
  nome: string;
  status: string;
  sistemaOperacional?: string | null;
  hostname?: string | null;
  usuarioLogado?: string | null;
  resolucaoTela?: string | null;
};

type RemoteSessionViewerProps = {
  terminal: Terminal;
};

export function RemoteSessionViewer({ terminal }: RemoteSessionViewerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(messages.remote.ready);
  const [zoom, setZoom] = useState(1);
  const isOnline = terminal.status === "ONLINE";
  const isActive = Boolean(sessaoId);

  async function ensureSocket() {
    if (socketRef.current?.connected) return socketRef.current;
    const response = await fetch("/api/auth/socket-token");
    const { token } = await response.json();
    const socket = io({ auth: { sessionToken: token, role: "technician" }, transports: ["websocket", "polling"] });
    await new Promise<void>((resolve) => socket.once("connect", () => resolve()));
    socketRef.current = socket;
    return socket;
  }

  function setupPeer(socket: Socket, sessionId: string) {
    peerRef.current?.close();
    const peer = new RTCPeerConnection(defaultRtcConfiguration);
    peerRef.current = peer;

    let remoteDescriptionSet = false;
    const candidateQueue: RTCIceCandidateInit[] = [];

    peer.ontrack = (event) => {
      if (videoRef.current) videoRef.current.srcObject = event.streams[0];
      setStatus(messages.remote.active);
      fetch("/api/remoto/sessoes", { method: "GET" }).catch(() => undefined);

      setTimeout(() => {
      videoRef.current?.focus();
      }, 300);
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit(remoteSocketEvents.webRtcCandidate, {
        sessaoId: sessionId,
        terminalId: terminal.id,
        candidate: event.candidate.toJSON(),
      });
    };

     socketRef.current?.off(remoteSocketEvents.webRtcOffer);
    socketRef.current?.off(remoteSocketEvents.webRtcAnswer);
    socketRef.current?.off(remoteSocketEvents.webRtcCandidate);
    socketRef.current?.off(remoteSocketEvents.sessionState);
    socketRef.current?.off(remoteSocketEvents.sessionEnd);

    socket.off(remoteSocketEvents.webRtcOffer);
    socket.on(remoteSocketEvents.webRtcOffer, async (payload: { sessaoId: string; offer: RTCSessionDescriptionInit }) => {
      if (payload.sessaoId !== sessionId) return;
      try {
        await peer.setRemoteDescription(payload.offer);
        remoteDescriptionSet = true;
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit(remoteSocketEvents.webRtcAnswer, {
          sessaoId: sessionId,
          terminalId: terminal.id,
          answer,
        });

        for (const candidate of candidateQueue) {
          await peer.addIceCandidate(candidate).catch((err) => {
            console.error("[webrtc] Failed to add queued candidate:", err);
          });
        }
        candidateQueue.length = 0;
      } catch (err) {
        console.error("[webrtc] Error setting remote description from offer:", err);
      }
    });
    socket.off(remoteSocketEvents.webRtcCandidate);
    socket.on(remoteSocketEvents.webRtcCandidate, async (payload: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
      if (payload.sessaoId !== sessionId || !payload.candidate) return;
      if (!remoteDescriptionSet) {
        candidateQueue.push(payload.candidate);
      } else {
        await peer.addIceCandidate(payload.candidate).catch((err) => {
          console.error("[webrtc] Error adding ICE candidate directly:", err);
        });
      }
    });

    socket.off(remoteSocketEvents.sessionState);
    socket.on(remoteSocketEvents.sessionState, (payload: { sessaoId: string; status: string }) => {
      if (payload.sessaoId === sessionId) setStatus(sessionStatusLabel(payload.status));
    });

    socket.off(remoteSocketEvents.sessionEnd);
    socket.on(remoteSocketEvents.sessionEnd, (payload: { sessaoId: string }) => {
      if (payload.sessaoId !== sessionId) return;
      endSessionLocal();
    });
  }

  async function startSession() {
    if (sessaoId) await endSession();

    setStatus(messages.remote.creating);
    try {
      const response = await fetch("/api/remoto/iniciar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        terminalId: terminal.id,
      }),
      });

      if (!response.ok) {
        const error = await readApiError(response, messages.remote.startFailed);
        setStatus(error);
        toast.error(error);
        return;
      }

      const data = await response.json();
      const socket = await ensureSocket();
      const sessionId = data.id as string;

      setSessaoId(sessionId);
      setupPeer(socket, sessionId);
      socket.emit("sessao:join", { sessaoId: sessionId });
      setStatus(messages.remote.waitingAgent);
    } catch {
      setStatus(messages.remote.startFailed);
      toast.error(messages.remote.startFailed);
    }
  }

  function endSessionLocal() {
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSessaoId(null);
    setStatus(messages.remote.ended);
  }

  async function endSession() {
    if (!sessaoId) return;
    await fetch("/api/remoto/encerrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessaoId }),
    });
    socketRef.current?.emit("sessao:leave", { sessaoId });
    endSessionLocal();
  }

 function sendMouseMove(event: React.MouseEvent<HTMLVideoElement>) {
  if (!sessaoId || !videoRef.current) return;

  const rect = videoRef.current.getBoundingClientRect();

  socketRef.current?.emit(
    remoteSocketEvents.mouseMove,
    {
      sessaoId,
      terminalId: terminal.id,
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      screenWidth: videoRef.current.videoWidth,
      screenHeight: videoRef.current.videoHeight,
    }
  );
}

  function sendMouseClick(event: React.MouseEvent<HTMLVideoElement>, button: "left" | "right", double = false) {
    if (!sessaoId || !videoRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    socketRef.current?.emit(remoteSocketEvents.mouseClick, {
      sessaoId,
      terminalId: terminal.id,
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
      button,
      double,
      screenWidth: videoRef.current.videoWidth,
      screenHeight: videoRef.current.videoHeight,
    });
  }

async function sendKeyDown(
  event: React.KeyboardEvent<HTMLVideoElement>
) {
  if (!sessaoId) return;

 
  if (event.repeat) {
    return;
  }

 
  if (
    event.ctrlKey &&
    event.key.toLowerCase() === "v"
  ) {
    event.preventDefault();

    try {
      const text = await navigator.clipboard.readText();

      if (text) {
        socketRef.current?.emit(
          remoteSocketEvents.keyboardType,
          {
            sessaoId,
            terminalId: terminal.id,
            text,
          }
        );
      }
    } catch (err) {
      console.error("Clipboard read failed:", err);
    }

    return;
  }

  // Impede comportamento da página local
  // (scroll, atalhos do navegador, espaço, etc)
  event.preventDefault();

  socketRef.current?.emit(
    remoteSocketEvents.keyboardKeyDown,
    {
      sessaoId,
      terminalId: terminal.id,
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
    }
  );
}

function sendKeyUp(event: React.KeyboardEvent<HTMLVideoElement>) {
  if (!sessaoId) return;

  event.preventDefault();

  socketRef.current?.emit(
    remoteSocketEvents.keyboardKeyUp,
    {
      sessaoId,
      terminalId: terminal.id,
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
    }
  );
}

function sendMouseWheel(
  event: React.WheelEvent<HTMLVideoElement>
) {
  if (!sessaoId) return;

  event.preventDefault();

  socketRef.current?.emit(
    remoteSocketEvents.mouseScroll,
    {
      sessaoId,
      terminalId: terminal.id,
      x: 0,
      y: 0,
      deltaX: event.deltaX,
      deltaY: event.deltaY,
    }
  );
}

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();
    };
  }, []);

  async function sendClipboard() {
    if (!sessaoId) return;
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        socketRef.current?.emit(remoteSocketEvents.keyboardType, { sessaoId, terminalId: terminal.id, text });
        toast.success("Texto enviado para o computador remoto.");
      }
    } catch {
      toast.error("Não foi possível acessar a área de transferência.");
    }
  }

  function takeScreenshot() {
            const video = videoRef.current;
            if (!video) return;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;
            canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
            const link = document.createElement("a");
            link.download = `sessao-${terminal.nome}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
  }

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col gap-4">
      <header className="rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <Link href="/terminais" className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar para terminais
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><MonitorUp className="h-4 w-4" /></div>
              <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">{terminal.nome}</h1>
              <TerminalStatusBadge status={terminal.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>{terminal.hostname ?? "Computador remoto"}</span>
              {terminal.sistemaOperacional && <span>{terminal.sistemaOperacional}</span>}
              {terminal.usuarioLogado && <span>Usuário: {terminal.usuarioLogado}</span>}
              {terminal.resolucaoTela && <span>{terminal.resolucaoTela}</span>}
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs">
              <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/50"}`} />
              <span className="text-muted-foreground">Sessão</span>
              <span className="font-semibold text-foreground">{sessionStatusLabel(status)}</span>
            </div>
            {!isActive ? (
              <Button onClick={startSession} disabled={!isOnline} className="gap-2">
                <MonitorUp className="h-4 w-4" /> Conectar
              </Button>
            ) : (
              <Button variant="destructive" onClick={endSession} className="gap-2">
                <Square className="h-4 w-4" /> Encerrar sessão
              </Button>
            )}
          </div>
        </div>
        {!isOnline && <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Este computador está offline. Aguarde-o ficar disponível para iniciar o acesso.</p>}
      </header>

      <div ref={containerRef} className="overflow-hidden rounded-xl border border-border/60 bg-zinc-950 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-white/10 bg-zinc-900 px-3 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div>
            <p className="text-xs font-semibold">Tela remota</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Clique na tela para controlar. Use Ctrl+V para colar texto.</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="icon" title="Tela cheia" aria-label="Abrir em tela cheia" className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => containerRef.current?.requestFullscreen()}><Expand className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Diminuir zoom" aria-label="Diminuir zoom" disabled={zoom <= 0.5} className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}><ZoomOut className="h-4 w-4" /></Button>
            <span className="min-w-11 text-center text-[11px] font-medium text-zinc-300">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="icon" title="Aumentar zoom" aria-label="Aumentar zoom" disabled={zoom >= 2} className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Reconectar" aria-label="Reconectar sessão" disabled={!isOnline} className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={startSession}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Capturar tela" aria-label="Capturar tela" disabled={!isActive} className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={takeScreenshot}><Camera className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid min-h-[520px] grid-rows-[1fr_auto] bg-black sm:min-h-[620px]">
        <div className="relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            tabIndex={0}
            autoPlay
            onWheel={sendMouseWheel}
            playsInline
            onKeyDown={sendKeyDown}
            onKeyUp={sendKeyUp}
            className="h-full max-h-[calc(100vh-15rem)] w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
            onMouseMove={sendMouseMove}
            onClick={(e) => {
              videoRef.current?.focus();
              sendMouseClick(e, "left");
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              videoRef.current?.focus();
              sendMouseClick(e, "right");
            }}
            onDoubleClick={(e) => sendMouseClick(e, "left", true)}
          />
          {!sessaoId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black p-6 text-center text-white">
              <div className="max-w-xs">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10"><MonitorUp className="h-6 w-6 text-white/80" /></div>
                <p className="text-sm font-semibold">Nenhuma sessão ativa</p>
                <p className="mt-1 text-xs text-white/60">Inicie uma conexão para visualizar e controlar este computador.</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-zinc-900 px-3 py-3 text-white sm:px-4">
          <Button variant="outline" size="sm" disabled={!isActive} className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => socketRef.current?.emit(remoteSocketEvents.keyboardKeyDown, { sessaoId, terminalId: terminal.id, key: "Delete", code: "Delete", ctrlKey: true, altKey: true })}>
            Ctrl+Alt+Del
          </Button>
          <Button
            variant="outline"
            size="icon"
            title="Colar texto da área de transferência"
            aria-label="Colar texto da área de transferência"
            disabled={!isActive}
            className="h-8 w-8 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={sendClipboard}
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <p className="ml-auto text-[11px] text-zinc-400">Atalhos e comandos são enviados ao computador remoto.</p>
        </div>
      </div>
      </div>
    </section>
  );
}
