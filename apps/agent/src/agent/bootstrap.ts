import { createAgentSocket, remoteSocketEvents } from "../socket/client";
import { getEquipmentUuid, getToken, setToken } from "../storage/store";
import { collectSystemInfo } from "../system/info";
import { startScreenShare, stopScreenShare } from "../webrtc/session";
import { handleMouseClick, handleMouseMove, handleMouseScroll, handleKeyboardKey } from "../input/controller";
import { HEARTBEAT_INTERVAL_MS } from "../../../../packages/shared/src/events";

export async function startAgent() {
  const equipmentUuid = getEquipmentUuid();
  let token = getToken();
  const socket = createAgentSocket(token);

  socket.on("connect", () => {
    const info = collectSystemInfo();
    socket.emit(remoteSocketEvents.terminalRegister, {
      equipmentUuid,
      token,
      ...info,
    }, (response: { ok?: boolean; token?: string }) => {
      if (response?.token) {
        token = response.token;
        setToken(response.token);
      }
    });
  });

  socket.on(remoteSocketEvents.terminalRegistered, (payload: { token: string }) => {
    setToken(payload.token);
  });

  socket.on(remoteSocketEvents.sessionCreate, async (payload: { sessaoId: string }) => {
    socket.emit(remoteSocketEvents.sessionAccept, { sessaoId: payload.sessaoId });
    await startScreenShare(socket, payload);
  });

  socket.on(remoteSocketEvents.sessionEnd, (payload: { sessaoId: string }) => {
    stopScreenShare();
  });

  socket.on(remoteSocketEvents.mouseMove, handleMouseMove);
  socket.on(remoteSocketEvents.mouseClick, handleMouseClick);
  socket.on(remoteSocketEvents.mouseScroll, handleMouseScroll);
  socket.on(remoteSocketEvents.keyboardKeyDown, (p) => handleKeyboardKey(p, "down"));
  socket.on(remoteSocketEvents.keyboardKeyUp, (p) => handleKeyboardKey(p, "up"));

  setInterval(() => {
    if (!socket.connected) return;
    const info = collectSystemInfo();
    socket.emit(remoteSocketEvents.terminalHeartbeat, { token: getToken(), ip: info.ip, usuarioLogado: info.usuarioLogado });
  }, HEARTBEAT_INTERVAL_MS);
}
