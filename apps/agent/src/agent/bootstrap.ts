import { createAgentSocket, remoteSocketEvents } from "../socket/client";
import {
  getEquipmentUuid,
  getToken,
  setToken,
  getServerUrl,
  getTerminalName,
} from "../storage/store";
import { collectSystemInfo } from "../system/info";
import { startScreenShare, stopScreenShare } from "../webrtc/session";
import {
  handleMouseClick,
  handleMouseMove,
  handleMouseScroll,
  handleKeyboardKey,
  handleTypeText,
} from "../input/controller";
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

const RECONNECT_DELAYS = [
  5000,
  10000,
  20000,
  30000,
];

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
  status = newStatus;
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

  stopScreenShare();
}

function scheduleReconnect(reason?: string) {
  if (!shouldReconnect) {
    return;
  }

  clearReconnectTimer();

  const delay =
    RECONNECT_DELAYS[
      Math.min(
        reconnectAttempts,
        RECONNECT_DELAYS.length - 1
      )
    ];

  reconnectAttempts++;

  updateStatus(
    `Reconectando em ${Math.floor(delay / 1000)}s`,
    reason ?? null
  );

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
  shouldReconnect = true;

  clearReconnectTimer();

  await cleanupConnection();

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
    const message =
      err instanceof Error
        ? err.message
        : "Falha ao criar socket";

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

    socket?.emit(
      remoteSocketEvents.terminalRegister,
      payload,
      (response: any) => {
        if (response?.ok) {
          if (response.token) {
            setToken(response.token);
          }

          updateStatus("Online");
        } else {
          const errorMessage =
            response?.error ??
            "Falha no registro do terminal";

          updateStatus(
            "Erro de Conexão",
            errorMessage
          );

          scheduleReconnect(errorMessage);
        }
      }
    );
  });

  socket.on("connect_error", (error) => {
    updateStatus(
      "Erro de Conexão",
      error.message
    );

    scheduleReconnect(error.message);
  });

  socket.on("disconnect", (reason) => {
    updateStatus(
      "Desconectado",
      String(reason)
    );

    if (
      shouldReconnect &&
      reason !== "io client disconnect"
    ) {
      scheduleReconnect(String(reason));
    }
  });

  socket.on(
    remoteSocketEvents.terminalRegistered,
    (payload: { token: string }) => {
      setToken(payload.token);

      reconnectAttempts = 0;

      updateStatus("Online");
    }
  );

  socket.on(
    remoteSocketEvents.sessionCreate,
    async (payload: { sessaoId: string }) => {
      if (!socket) {
        return;
      }

      socket.emit(
        remoteSocketEvents.sessionAccept,
        {
          sessaoId: payload.sessaoId,
        }
      );

      await startScreenShare(
        socket,
        payload
      );
    }
  );

  socket.on(
    remoteSocketEvents.sessionEnd,
    () => {
      stopScreenShare();
    }
  );

  socket.on(
    remoteSocketEvents.mouseMove,
    handleMouseMove
  );

  socket.on(
    remoteSocketEvents.mouseClick,
    handleMouseClick
  );

  socket.on(
    remoteSocketEvents.mouseScroll,
    handleMouseScroll
  );

  socket.on(
    remoteSocketEvents.keyboardKeyDown,
    (payload) =>
      handleKeyboardKey(payload, "down")
  );

  socket.on(
    remoteSocketEvents.keyboardKeyUp,
    (payload) =>
      handleKeyboardKey(payload, "up")
  );

  socket.on(
  remoteSocketEvents.keyboardType,
  handleTypeText
);



  heartbeatInterval = setInterval(() => {
    if (!socket || !socket.connected) {
      return;
    }

    


    const info = collectSystemInfo();

    socket.emit(
      remoteSocketEvents.terminalHeartbeat,
      {
        token: getToken(),
        ip: info.ip,
        usuarioLogado: info.usuarioLogado,
      }
    );
  }, HEARTBEAT_INTERVAL_MS);
}

