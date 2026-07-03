import { io, Socket } from "socket.io-client";
import { remoteSocketEvents } from "../../../../packages/shared/src/events";

const SERVER_URL = process.env.TI_SERVER_URL ?? "http://localhost:3000";

export function createAgentSocket(token?: string) {
  return io(SERVER_URL, {
    auth: { token, role: "agent" },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
  });
}

export { remoteSocketEvents, Socket };
