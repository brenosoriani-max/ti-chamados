import type { Server, Socket } from "socket.io";
import { jwtVerify } from "jose";
import { remoteSocketEvents, HEARTBEAT_TIMEOUT_MS } from "@shared/events";
import {
  registerOrUpdateTerminal,
  touchTerminalHeartbeat,
  markTerminalOfflineByToken,
  findTerminalByToken,
  sweepStaleTerminals,
} from "@/lib/remote/services/terminal-service";
import { updateSessionStatus, findSession } from "@/lib/remote/services/session-service";
import { emitTerminalUpdated, setSocketServer, getSessionTerminalId, mapSessionTerminal, emitToTerminal } from "@/lib/remote/socket-bridge";
import { SessaoRemotaStatus } from "@/types";
import type { TerminalRegisterPayload } from "@/lib/remote/events";

type AgentSocket = Socket & { terminalId?: string; terminalToken?: string; role?: "agent" };
type TechSocket = Socket & { userId?: string; role?: "technician" };

const terminalSockets = new Map<string, string>();

function jwtSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? "dev-secret-change-me");
}

async function verifyTechnicianToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const role = String(payload.role);
    if (role !== "ADMIN" && role !== "TECNICO") return null;
    return {
      id: String(payload.id),
      name: String(payload.name),
      role,
    };
  } catch {
    return null;
  }
}

function broadcastTerminal(terminal: {
  id: string;
  status: string;
  ultimaConexao?: Date;
  ip?: string;
  usuarioLogado?: string;
  versaoAgente?: string;
  sistemaOperacional?: string;
  hostname?: string;
  memoriaRamGb?: number;
  processador?: string;
  quantidadeMonitores?: number;
}) {
  emitTerminalUpdated({
    id: terminal.id,
    status: terminal.status,
    ultimaConexao: terminal.ultimaConexao?.toISOString(),
    ip: terminal.ip,
    usuarioLogado: terminal.usuarioLogado,
    versaoAgente: terminal.versaoAgente,
    sistemaOperacional: terminal.sistemaOperacional,
    hostname: terminal.hostname,
    memoriaRamGb: terminal.memoriaRamGb,
    processador: terminal.processador,
    quantidadeMonitores: terminal.quantidadeMonitores,
  });
}

function bindAgentHandlers(socket: AgentSocket) {
  
  socket.on(remoteSocketEvents.terminalRegister, async (payload: TerminalRegisterPayload, ack?: (r: unknown) => void) => {
    try {
      const terminal = await registerOrUpdateTerminal({
        ...payload,
        token: payload.token ?? socket.terminalToken,
      });
      socket.terminalId = terminal.id;
      socket.terminalToken = terminal.token;
      socket.join(`terminal:${terminal.id}`);
      terminalSockets.set(terminal.id, socket.id);

      socket.emit(remoteSocketEvents.terminalRegistered, {
        terminalId: terminal.id,
        token: terminal.token,
        identificador: terminal.identificador,
      });
      broadcastTerminal(terminal);
      ack?.({ ok: true, terminalId: terminal.id, token: terminal.token });
    } catch (error) {
      ack?.({ ok: false, error: error instanceof Error ? error.message : "register failed" });
    }
  });

  socket.on(remoteSocketEvents.terminalHeartbeat, async (payload: { token?: string; ip?: string; usuarioLogado?: string }) => {
    const token = payload?.token ?? socket.terminalToken;
    if (!token) return;
    const terminal = await touchTerminalHeartbeat(token, payload?.ip, payload?.usuarioLogado);
    if (terminal) broadcastTerminal(terminal);
  });

  socket.on(remoteSocketEvents.sessionAccept, async (payload: { sessaoId: string }) => {
    await updateSessionStatus(payload.sessaoId, SessaoRemotaStatus.CONECTANDO, {
      log: { action: "sessao:accept", at: new Date().toISOString() },
    });
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.sessionState, {
      sessaoId: payload.sessaoId,
      status: SessaoRemotaStatus.CONECTANDO,
    });
  });

  socket.on(remoteSocketEvents.sessionReject, async (payload: { sessaoId: string; reason?: string }) => {
    await updateSessionStatus(payload.sessaoId, SessaoRemotaStatus.ENCERRADA, {
      encerradaEm: new Date(),
      log: { action: "sessao:reject", reason: payload.reason, at: new Date().toISOString() },
    });
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.sessionEnd, payload);
  });

  socket.on(remoteSocketEvents.webRtcOffer, async (payload: { sessaoId: string; offer: unknown }) => {
    await updateSessionStatus(payload.sessaoId, SessaoRemotaStatus.ATIVA, {
      iniciadaEm: new Date(),
      log: { action: "webrtc:offer", at: new Date().toISOString() },
    });
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.sessionState, {
      sessaoId: payload.sessaoId,
      status: SessaoRemotaStatus.ATIVA,
    });
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.webRtcOffer, payload);
  });

  socket.on(remoteSocketEvents.webRtcAnswer, (payload: { sessaoId: string; answer: unknown }) => {
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.webRtcAnswer, payload);
  });

  socket.on(remoteSocketEvents.webRtcCandidate, (payload: { sessaoId: string; candidate: unknown }) => {
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.webRtcCandidate, payload);
  });

}

async function resolveTerminalId(sessaoId: string, payloadTerminalId?: string): Promise<string> {
  if (payloadTerminalId) return payloadTerminalId;
  const inMemory = getSessionTerminalId(sessaoId);
  if (inMemory) return inMemory;
  try {
    const sessao = await findSession(sessaoId);
    if (sessao?.terminalId) {
      mapSessionTerminal(sessaoId, sessao.terminalId);
      return sessao.terminalId;
    }
  } catch (error) {
    console.error(`[remote-socket] Error resolving terminal ID for session ${sessaoId}:`, error);
  }
  return "";
}

function bindTechnicianHandlers(socket: TechSocket) {
  socket.join("technicians");

  socket.on("sessao:join", async (payload: { sessaoId: string; monitorIndex?: number }) => {
    socket.join(`sessao:${payload.sessaoId}`);

    try {
      const sessao = await findSession(payload.sessaoId);
      if (sessao && sessao.status === SessaoRemotaStatus.AGUARDANDO) {
        mapSessionTerminal(sessao.id, sessao.terminalId);
        emitToTerminal(sessao.terminalId, remoteSocketEvents.sessionCreate, {
          sessaoId: sessao.id,
          terminalId: sessao.terminalId,
          usuarioId: sessao.usuarioId,
          usuarioNome: sessao.usuario?.name ?? "Tecnico",
          monitorIndex: payload.monitorIndex ?? 0,
        });
      }
    } catch (error) {
      console.error("[remote-socket] Error during sessao:join logic:", error);
    }
  });

  socket.on("sessao:leave", (payload: { sessaoId: string }) => {
    socket.leave(`sessao:${payload.sessaoId}`);
  });

  socket.on(remoteSocketEvents.webRtcAnswer, async (payload: { sessaoId: string; answer: unknown; terminalId?: string }) => {
    const terminalId = await resolveTerminalId(payload.sessaoId, payload.terminalId);
    if (terminalId) {
      socket.to(`terminal:${terminalId}`).emit(remoteSocketEvents.webRtcAnswer, payload);
    }
    socket.to(`sessao:${payload.sessaoId}`).emit(remoteSocketEvents.webRtcAnswer, payload);
  });

  socket.on(remoteSocketEvents.webRtcCandidate, async (payload: { sessaoId: string; candidate: unknown; terminalId?: string }) => {
    const terminalId = await resolveTerminalId(payload.sessaoId, payload.terminalId);
    const room = terminalId ? `terminal:${terminalId}` : `sessao:${payload.sessaoId}`;
    socket.to(room).emit(remoteSocketEvents.webRtcCandidate, payload);
  });

  const relayToAgent = (event: string) => {
    socket.on(event, async (payload: { sessaoId: string; terminalId?: string }) => {
      const terminalId = await resolveTerminalId(payload.sessaoId, payload.terminalId);
      if (terminalId) {
        socket.to(`terminal:${terminalId}`).emit(event, payload);
      }
    });
  };

  [
    remoteSocketEvents.mouseMove,
    remoteSocketEvents.mouseClick,
    remoteSocketEvents.mouseScroll,
    remoteSocketEvents.keyboardKeyDown,
    remoteSocketEvents.keyboardKeyUp,
    remoteSocketEvents.clipboardGet,
    remoteSocketEvents.clipboardSet,
    remoteSocketEvents.qualityChange,
    remoteSocketEvents.fileTransferStart,
    remoteSocketEvents.fileTransferChunk,
    remoteSocketEvents.fileTransferEnd,
    remoteSocketEvents.fileTransferCancel,
  ].forEach(relayToAgent);
}

export function setupRemoteSocket(io: Server) {
  setSocketServer(io);

  setInterval(() => {
    sweepStaleTerminals(HEARTBEAT_TIMEOUT_MS).then((stale) => {
      stale.forEach((terminal) => broadcastTerminal(terminal));
    });
  }, HEARTBEAT_TIMEOUT_MS);

  io.use(async (socket, next) => {
    const auth = socket.handshake.auth as { token?: string; sessionToken?: string; role?: string };
    const hasAuth = Boolean(auth.token || auth.sessionToken || auth.role);
    if (!hasAuth) return next();

    try {
      if (auth.role === "agent" || auth.token) {
        if (!auth.token && process.env.ALLOW_AGENT_AUTO_REGISTER !== "1") {
          return next(new Error("Token obrigatorio"));
        }
        (socket as AgentSocket).role = "agent";
        (socket as AgentSocket).terminalToken = auth.token;
        if (auth.token) {
          const terminal = await findTerminalByToken(auth.token);
          if (terminal) (socket as AgentSocket).terminalId = terminal.id;
        }
        return next();
      }

      const user = await verifyTechnicianToken(auth.sessionToken);
      if (!user) return next(new Error("Nao autenticado"));
      (socket as TechSocket).role = "technician";
      (socket as TechSocket).userId = user.id;
      return next();
    } catch (error) {
      next(error instanceof Error ? error : new Error("auth failed"));
    }
  });

  io.on("connection", (socket) => {
    if ((socket as AgentSocket).role === "agent") {
      bindAgentHandlers(socket as AgentSocket);
    } else if ((socket as TechSocket).role === "technician") {
      bindTechnicianHandlers(socket as TechSocket);
    }

    socket.on("disconnect", async () => {
      const agent = socket as AgentSocket;
      if (agent.role === "agent" && agent.terminalToken) {
        const terminal = await markTerminalOfflineByToken(agent.terminalToken);
        if (agent.terminalId) terminalSockets.delete(agent.terminalId);
        if (terminal) broadcastTerminal(terminal);
      }
    });
  });
}

export function getTerminalSocketId(terminalId: string) {
  return terminalSockets.get(terminalId);
}
