import { io } from "socket.io-client";
import { config } from "../config/index.js";
import { events } from "./events.js";
import { startScreenShare, stopScreenShare } from "../webrtc/session.js";
import { moveMouse, clickMouse, scrollMouse } from "../mouse/controller.js";
import { keyDown, keyUp } from "../keyboard/controller.js";

export function createSocket(token) {
  const socket = io(config.socketUrl, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });

  socket.on("connect", () => {
    socket.emit(events.terminalRegister, { token, hostname: config.hostname, port: config.port, protocol: config.protocol});
  });

  socket.on(events.sessionCreate, async (payload) => {
    socket.emit(events.sessionAccept, { sessaoId: payload.sessaoId });
    await startScreenShare(socket, payload);
  });

  socket.on(events.sessionEnd, async () => {
    await stopScreenShare();
  });

  socket.on(events.mouseMove, moveMouse);
  socket.on(events.mouseClick, clickMouse);
  socket.on(events.mouseScroll, scrollMouse);
  socket.on(events.keyboardKeyDown, keyDown);
  socket.on(events.keyboardKeyUp, keyUp);

  return socket;
}
