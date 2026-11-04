import { io, Socket } from "socket.io-client";
import { remoteSocketEvents } from "../../../../packages/shared/src/events";

export function normalizeServerUrl(serverUrl: string) {
  const trimmed = serverUrl.trim();

  if (!trimmed) return trimmed;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function createAgentSocket(serverUrl: string, token?: string) {
  const normalizedUrl = normalizeServerUrl(serverUrl);

  return io(normalizedUrl, {
    auth: { token, role: "agent" },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
    timeout: 15000,
    forceNew: true,
  });
}

export { remoteSocketEvents, Socket };

