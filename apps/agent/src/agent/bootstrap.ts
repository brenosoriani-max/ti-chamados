import { createAgentSocket, remoteSocketEvents } from "../socket/client";
import { getEquipmentUuid, getToken, setToken, getServerUrl, getTerminalName } from "../storage/store";
import { collectSystemInfo } from "../system/info";
import { startScreenShare, stopScreenShare } from "../webrtc/session";
import { handleMouseClick, handleMouseMove, handleMouseScroll, handleKeyboardKey } from "../input/controller";
import { HEARTBEAT_INTERVAL_MS } from "../../../../packages/shared/src/events";
import type { Socket } from "socket.io-client";

let socket: Socket | null = null;
let status = "Desconectado";
let connectionError: string | null = null;
let onStatusChangeCallback: ((data: { status: string; error: string | null; token?: string }) => void) | null = null;
let heartbeatInterval: NodeJS.Timeout | null = null;

export function setStatusChangeListener(callback: typeof onStatusChangeCallback) {
  onStatusChangeCallback = callback;
}

export function getAgentStatus() {
  return { status, error: connectionError, token: getToken() };
}

function updateStatus(newStatus: string, error: string | null = null) {
  status = newStatus;
  connectionError = error;
  onStatusChangeCallback?.({ status, error, token: getToken() || undefined });
}

export async function stopAgent() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  stopScreenShare();
  updateStatus("Desconectado");
}

export async function startAgent() {
  await stopAgent();

  const serverUrl = getServerUrl();
  if (!serverUrl) {
    updateStatus("Desconfigurado");
    return;
  }

  updateStatus("Conectando...");

  const equipmentUuid = getEquipmentUuid();
  const token = getToken();
  const terminalNameSetting = getTerminalName();

  try {
    socket = createAgentSocket(serverUrl, token);
  } catch (err) {
    updateStatus("Erro de Conexão", err instanceof Error ? err.message : "Falha ao criar socket");
    return;
  }

  socket.on("connect", () => {
    const info = collectSystemInfo();
    const payload: any = {
      equipmentUuid,
      token,
      ...info,
    };
    if (terminalNameSetting) {
      payload.machineName = terminalNameSetting;
    }
    
    socket!.emit(remoteSocketEvents.terminalRegister, payload, (response: any) => {
      if (response && response.ok) {
        if (response.token) {
          setToken(response.token);
        }
        updateStatus("Online");
      } else {
        updateStatus("Erro de Conexão", response?.error ?? "Falha no registro");
      }
    });
  });

  socket.on("connect_error", (error) => {
    updateStatus("Erro de Conexão", error.message);
  });

  socket.on("disconnect", (reason) => {
    updateStatus("Desconectado", String(reason));
  });

  socket.on(remoteSocketEvents.terminalRegistered, (payload: { token: string }) => {
    setToken(payload.token);
    updateStatus("Online");
  });

  socket.on(remoteSocketEvents.sessionCreate, async (payload: { sessaoId: string }) => {
    if (socket) {
      socket.emit(remoteSocketEvents.sessionAccept, { sessaoId: payload.sessaoId });
      await startScreenShare(socket, payload);
    }
  });

  socket.on(remoteSocketEvents.sessionEnd, (payload: { sessaoId: string }) => {
    stopScreenShare();
  });

  socket.on(remoteSocketEvents.mouseMove, handleMouseMove);
  socket.on(remoteSocketEvents.mouseClick, handleMouseClick);
  socket.on(remoteSocketEvents.mouseScroll, handleMouseScroll);
  socket.on(remoteSocketEvents.keyboardKeyDown, (p) => handleKeyboardKey(p, "down"));
  socket.on(remoteSocketEvents.keyboardKeyUp, (p) => handleKeyboardKey(p, "up"));

  heartbeatInterval = setInterval(() => {
    if (!socket || !socket.connected) return;
    const info = collectSystemInfo();
    const tokenActive = getToken();
    socket.emit(remoteSocketEvents.terminalHeartbeat, { 
      token: tokenActive, 
      ip: info.ip, 
      usuarioLogado: info.usuarioLogado 
    });
  }, HEARTBEAT_INTERVAL_MS);
}

