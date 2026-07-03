"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Expand, Keyboard, MonitorUp, MousePointer2, RefreshCw, Square, ZoomIn, ZoomOut } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { TerminalStatusBadge } from "@/components/terminal-status-badge";
import { defaultRtcConfiguration, remoteSocketEvents } from "@/lib/remote/events";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const [sessaoId, setSessaoId] = useState<string | null>(null);
  const [status, setStatus] = useState("Pronto");
  const [zoom, setZoom] = useState(1);

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

    peer.ontrack = (event) => {
      if (videoRef.current) videoRef.current.srcObject = event.streams[0];
      setStatus("Ativa");
      fetch("/api/remoto/sessoes", { method: "GET" }).catch(() => undefined);
    };

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;
      socket.emit(remoteSocketEvents.webRtcCandidate, {
        sessaoId: sessionId,
        terminalId: terminal.id,
        candidate: event.candidate.toJSON(),
      });
    };

    socket.off(remoteSocketEvents.webRtcOffer);
    socket.on(remoteSocketEvents.webRtcOffer, async (payload: { sessaoId: string; offer: RTCSessionDescriptionInit }) => {
      if (payload.sessaoId !== sessionId) return;
      await peer.setRemoteDescription(payload.offer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit(remoteSocketEvents.webRtcAnswer, {
        sessaoId: sessionId,
        terminalId: terminal.id,
        answer,
      });
    });

    socket.off(remoteSocketEvents.webRtcCandidate);
    socket.on(remoteSocketEvents.webRtcCandidate, async (payload: { sessaoId: string; candidate: RTCIceCandidateInit }) => {
      if (payload.sessaoId !== sessionId || !payload.candidate) return;
      await peer.addIceCandidate(payload.candidate);
    });

    socket.off(remoteSocketEvents.sessionState);
    socket.on(remoteSocketEvents.sessionState, (payload: { sessaoId: string; status: string }) => {
      if (payload.sessaoId === sessionId) setStatus(payload.status);
    });

    socket.off(remoteSocketEvents.sessionEnd);
    socket.on(remoteSocketEvents.sessionEnd, (payload: { sessaoId: string }) => {
      if (payload.sessaoId !== sessionId) return;
      endSessionLocal();
    });
  }

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

    const socket = await ensureSocket();
    const sessionId = data.id as string;
    setSessaoId(sessionId);
    socket.emit("sessao:join", { sessaoId: sessionId });
    setupPeer(socket, sessionId);
    setStatus("Aguardando agente");
  }

  function endSessionLocal() {
    peerRef.current?.close();
    peerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSessaoId(null);
    setStatus("Encerrada");
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
    const x = ((event.clientX - rect.left) / rect.width) * videoRef.current.videoWidth;
    const y = ((event.clientY - rect.top) / rect.height) * videoRef.current.videoHeight;
    socketRef.current?.emit(remoteSocketEvents.mouseMove, {
      sessaoId,
      terminalId: terminal.id,
      x,
      y,
      screenWidth: videoRef.current.videoWidth,
      screenHeight: videoRef.current.videoHeight,
    });
  }

  function sendMouseClick(event: React.MouseEvent<HTMLVideoElement>, button: "left" | "right", double = false) {
    if (!sessaoId || !videoRef.current) return;
    const rect = videoRef.current.getBoundingClientRect();
    socketRef.current?.emit(remoteSocketEvents.mouseClick, {
      sessaoId,
      terminalId: terminal.id,
      x: ((event.clientX - rect.left) / rect.width) * videoRef.current.videoWidth,
      y: ((event.clientY - rect.top) / rect.height) * videoRef.current.videoHeight,
      button,
      double,
      screenWidth: videoRef.current.videoWidth,
      screenHeight: videoRef.current.videoHeight,
    });
  }

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-col gap-3 border-b border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <MonitorUp className="h-5 w-5 text-primary" />
            <h1 className="truncate text-sm font-bold">{terminal.nome}</h1>
            <TerminalStatusBadge status={terminal.status} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Sessao: <span className="font-semibold text-foreground">{status}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!sessaoId ? (
            <Button onClick={startSession} disabled={terminal.status !== "ONLINE"} className="gap-2">
              <MonitorUp className="h-4 w-4" /> Conectar
            </Button>
          ) : (
            <Button variant="destructive" onClick={endSession} className="gap-2">
              <Square className="h-4 w-4" /> Encerrar
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => containerRef.current?.requestFullscreen()}><Expand className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}><ZoomIn className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={startSession}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => {
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
          }}><Camera className="h-4 w-4" /></Button>
        </div>
      </div>

      <div ref={containerRef} className="grid min-h-[620px] grid-rows-[1fr_auto] bg-black">
        <div className="relative flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="h-full max-h-[calc(100vh-15rem)] w-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
            onMouseMove={sendMouseMove}
            onClick={(e) => sendMouseClick(e, "left")}
            onContextMenu={(e) => { e.preventDefault(); sendMouseClick(e, "right"); }}
            onDoubleClick={(e) => sendMouseClick(e, "left", true)}
          />
          {!sessaoId && (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-center text-white">
              <div>
                <MonitorUp className="mx-auto mb-4 h-10 w-10 opacity-70" />
                <p className="text-sm font-bold">Nenhuma sessao ativa</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-white/10 bg-zinc-950 px-4 py-3 text-white">
          <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => socketRef.current?.emit(remoteSocketEvents.keyboardKeyDown, { sessaoId, terminalId: terminal.id, key: "Delete", code: "Delete", ctrlKey: true, altKey: true })}>
            Ctrl+Alt+Del
          </Button>
          <Button variant="outline" size="icon"><MousePointer2 className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><Keyboard className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
