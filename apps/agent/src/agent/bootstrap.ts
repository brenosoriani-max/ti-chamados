import { createAgentSocket, remoteSocketEvents } from "../socket/client";
import {
  getEquipmentUuid,
  getToken,
  setToken,
  getServerUrl,
  getTerminalName,
} from "../storage/store";
import { collectSystemInfo } from "../system/info";
import { HEARTBEAT_INTERVAL_MS } from "../../../../packages/shared/src/events";
import type { Socket } from "socket.io-client";

let socket: Socket | null = null;

let status = "Desconectado";
let connectionError: string | null = null;

let onStatusChangeCallback:
  | ((data: {
      status: string;
      error: string | null;
      token?: string;
    }) => void)
  | null = null;

let heartbeatInterval: NodeJS.Timeout | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

let shouldReconnect = true;
let reconnectAttempts = 0;

let startInProgress = false;

const RECONNECT_DELAYS = [
  3000,
  5000,
  10000,
  20000,
  30000,
];

function normalizeStatusLabel(status: string) {
  if (status.startsWith("Reconectando")) return "Reconectando";
  if (status.startsWith("Conectando")) return "Conectando";
  if (status === "Online") return "Online";
  if (status.startsWith("Erro de Conexão")) return "Erro de Conexão";
  if (status === "Desconectado") return "Desconectado";
  if (status === "Desconfigurado") return "Desconfigurado";
  return status;
}

export function setStatusChangeListener(
  callback: typeof onStatusChangeCallback
) {
  onStatusChangeCallback = callback;
}

export function getAgentStatus() {
  return {
    status,
    error: connectionError,
    token: getToken(),
  };
}

function updateStatus(
  newStatus: string,
  error: string | null = null
) {
  status = normalizeStatusLabel(newStatus);
  connectionError = error;

  onStatusChangeCallback?.({
    status,
    error,
    token: getToken() || undefined,
  });
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

async function cleanupConnection() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

function scheduleReconnect(reason?: string) {
  if (!shouldReconnect) {
    return;
  }

  clearReconnectTimer();

  const delay =
    RECONNECT_DELAYS[
      Math.min(reconnectAttempts, RECONNECT_DELAYS.length - 1)
    ];

  reconnectAttempts += 1;

  const reconnectStatus = `Reconectando em ${Math.floor(delay / 1000)}s`;
  updateStatus(reconnectStatus, reason ?? connectionError ?? "Conexão perdida");

  reconnectTimer = setTimeout(async () => {
    if (!shouldReconnect) {
      return;
    }

    await startAgent();
  }, delay);
}

export async function stopAgent() {
  shouldReconnect = false;

  clearReconnectTimer();

  reconnectAttempts = 0;

  await cleanupConnection();

  updateStatus("Parado");
}

export async function startAgent() {
  if (startInProgress) {
    return;
  }

  startInProgress = true;
  shouldReconnect = true;

  try {
    clearReconnectTimer();
    await cleanupConnection();

    const serverUrl = getServerUrl();

    if (!serverUrl || !isValidServerUrl(serverUrl)) {
      updateStatus("Desconfigurado", "URL do servidor inválida ou ausente");
      return;
    }

    updateStatus("Conectando...");

    const equipmentUuid = getEquipmentUuid();
    const token = getToken();
    const terminalNameSetting = getTerminalName();

    try {
      socket = createAgentSocket(serverUrl, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao criar socket";
      updateStatus("Erro de Conexão", message);
      scheduleReconnect(message);
      return;
    }

    socket.on("connect", () => {
      reconnectAttempts = 0;

      const info = collectSystemInfo();

      const payload: any = {
        equipmentUuid,
        token,
        ...info,
      };

      if (terminalNameSetting) {
        payload.machineName = terminalNameSetting;
      }

      socket?.emit(remoteSocketEvents.terminalRegister, payload, (response: any) => {
        if (response?.ok) {
          if (response.token) {
            setToken(response.token);
          }

          updateStatus("Online");
        } else {
          const errorMessage = response?.error ?? "Falha no registro do terminal";
          updateStatus("Erro de Conexão", errorMessage);
          scheduleReconnect(errorMessage);
        }
      });
    });

    socket.on("connect_error", (error) => {
      updateStatus("Erro de Conexão", error.message);
      scheduleReconnect(error.message);
    });

    socket.on("disconnect", (reason) => {
      const reasonText = String(reason || "desconectado");
      updateStatus("Desconectado", reasonText);

      if (shouldReconnect && reason !== "io client disconnect") {
        scheduleReconnect(reasonText);
      }
    });

    socket.on(remoteSocketEvents.terminalRegistered, (payload: { token: string }) => {
      setToken(payload.token);

      reconnectAttempts = 0;
      updateStatus("Online");
    });

    heartbeatInterval = setInterval(() => {
      if (!socket || !socket.connected) {
        return;
      }

      const info = collectSystemInfo();

      socket.emit(remoteSocketEvents.terminalHeartbeat, {
        token: getToken(),
        ip: info.ip,
        usuarioLogado: info.usuarioLogado,
      });
    }, HEARTBEAT_INTERVAL_MS);
  } finally {
    startInProgress = false;
  }
}

function isValidServerUrl(url: string) {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
