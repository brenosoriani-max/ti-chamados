import { randomUUID } from "crypto";
import { getRepository, initializeDatabase } from "@/lib/database";
import { Terminal } from "@/entities/Terminal";
import { TerminalStatus } from "@/types";

export function normalizeAgentVersion(value?: string | null) {
  if (!value) return undefined;

  const cleaned = String(value).trim().replace(/\s+/g, " ");
  if (!cleaned) return undefined;

  const limited = cleaned.slice(0, 40);
  return limited || undefined;
}

export async function ensureUserTerminal({
  userId,
  userName,
  email,
  ip,
  userAgent,
  online = true,
}: {
  userId: string;
  userName?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  online?: boolean;
}) {
  await initializeDatabase();

  const terminalRepository = getRepository(Terminal);
  const identifier = userId || email || `terminal-${randomUUID()}`;

  let terminal = await terminalRepository.findOne({
    where: [{ userId }, { identificador: identifier }],
  });

  const safeAgentVersion = normalizeAgentVersion(userAgent);

  if (!terminal) {
    terminal = terminalRepository.create({
      nome: userName || email || "Terminal",
      identificador: identifier,
      userId,
      token: randomUUID(),
      status: online ? TerminalStatus.ONLINE : TerminalStatus.OFFLINE,
      ip: ip || undefined,
      ultimaConexao: online ? new Date() : undefined,
      usuarioLogado: userName || undefined,
      hostname: userName || undefined,
      versaoAgente: safeAgentVersion,
    });
  } else {
    terminal.nome = userName || terminal.nome || email || "Terminal";
    terminal.userId = userId;
    terminal.status = online ? TerminalStatus.ONLINE : TerminalStatus.OFFLINE;
    terminal.ip = ip || terminal.ip;
    terminal.ultimaConexao = online ? new Date() : terminal.ultimaConexao;
    terminal.usuarioLogado = userName || terminal.usuarioLogado;
    terminal.versaoAgente = safeAgentVersion || terminal.versaoAgente;
    terminal.hostname = userName || terminal.hostname;
  }

  await terminalRepository.save(terminal);

  return { terminal };
}

export async function deleteTerminalById(id: string) {
  await initializeDatabase();
  const terminalRepository = getRepository(Terminal);
  const terminal = await terminalRepository.findOne({ where: { id } });

  if (!terminal) return false;

  await terminalRepository.remove(terminal);
  return true;
}

export function emitTerminalUpdated(_payload: Record<string, unknown>) {
  return _payload;
}

export function emitTicketMessage(_ticketId: string, payload: unknown, _isInternal?: boolean) {
  return payload;
}
