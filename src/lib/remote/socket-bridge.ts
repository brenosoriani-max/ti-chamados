import type { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;
const sessionTerminalMap = new Map<string, string>();

export function setSocketServer(io: SocketIOServer) {
  ioInstance = io;
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}

export function mapSessionTerminal(sessaoId: string, terminalId: string) {
  sessionTerminalMap.set(sessaoId, terminalId);
}

export function getSessionTerminalId(sessaoId: string) {
  return sessionTerminalMap.get(sessaoId);
}

export function emitToTerminal(terminalId: string, event: string, payload: unknown) {
  ioInstance?.to(`terminal:${terminalId}`).emit(event, payload);
}

export function emitToSession(sessaoId: string, event: string, payload: unknown) {
  ioInstance?.to(`sessao:${sessaoId}`).emit(event, payload);
}

export function emitTerminalUpdated(payload: unknown) {
  ioInstance?.to("technicians").emit("terminal:updated", payload);
}
