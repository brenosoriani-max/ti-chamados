import type { Server as SocketIOServer } from "socket.io";

// IMPORTANTE: server/socket/setup.ts é carregado via tsx (fora do Next.js),
// enquanto as rotas de API são compiladas pelo bundler do Next.js. Cada um
// gera sua PRÓPRIA cópia deste módulo em memória. Se guardássemos o io e o
// map de sessões em variáveis normais de módulo, setSocketServer() setaria
// uma cópia e emitToTerminal()/getSessionTerminalId() leriam de outra,
// sempre null/vazia — o mesmo tipo de duplicação de módulo que já causou
// o bug de metadata do TypeORM. Usar globalThis garante uma única
// instância real por processo Node, não importa quem importou o módulo.

type RemoteBridgeGlobal = {
  ioInstance: SocketIOServer | null;
  sessionTerminalMap: Map<string, string>;
};

const globalForRemoteBridge = globalThis as unknown as {
  __remoteBridge?: RemoteBridgeGlobal;
};

const bridge: RemoteBridgeGlobal =
  globalForRemoteBridge.__remoteBridge ??
  (globalForRemoteBridge.__remoteBridge = {
    ioInstance: null,
    sessionTerminalMap: new Map<string, string>(),
  });

export function setSocketServer(io: SocketIOServer) {
  bridge.ioInstance = io;
}

export function getSocketServer(): SocketIOServer | null {
  return bridge.ioInstance;
}

export function mapSessionTerminal(sessaoId: string, terminalId: string) {
  bridge.sessionTerminalMap.set(sessaoId, terminalId);
}

export function getSessionTerminalId(sessaoId: string) {
  return bridge.sessionTerminalMap.get(sessaoId);
}

export function emitToTerminal(terminalId: string, event: string, payload: unknown) {
  if (!bridge.ioInstance) {
    console.warn(`[remote] ioInstance ainda não setado — evento "${event}" para terminal ${terminalId} não foi enviado`);
    return;
  }
  bridge.ioInstance.to(`terminal:${terminalId}`).emit(event, payload);
}

export function emitToSession(sessaoId: string, event: string, payload: unknown) {
  if (!bridge.ioInstance) {
    console.warn(`[remote] ioInstance ainda não setado — evento "${event}" para sessão ${sessaoId} não foi enviado`);
    return;
  }
  bridge.ioInstance.to(`sessao:${sessaoId}`).emit(event, payload);
}

export function emitTerminalUpdated(payload: unknown) {
  bridge.ioInstance?.to("technicians").emit("terminal:updated", payload);
}