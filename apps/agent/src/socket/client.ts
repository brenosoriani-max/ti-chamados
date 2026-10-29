import { io, Socket } from "socket.io-client";
import { remoteSocketEvents } from "../../../../packages/shared/src/events";

export function createAgentSocket(serverUrl: string, token?: string) {
  return io(serverUrl, {
    auth: { token, role: "agent" },
    transports: ["websocket", "polling"],
    reconnection: false,
    timeout: 12000,
  });
}

export { remoteSocketEvents, Socket };

