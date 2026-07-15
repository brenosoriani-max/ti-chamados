import "reflect-metadata";
import { randomBytes } from "crypto";
import { getRepository, initializeDatabase } from "@/lib/database";
import { Terminal } from "@/entities/Terminal";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { TerminalStatus } from "@/types";
import type { TerminalRegisterPayload } from "@/lib/remote/events";

export async function registerOrUpdateTerminal(payload: TerminalRegisterPayload) {
  await initializeDatabase();
  const repo = getRepository(Terminal);

  if (!payload.equipmentUuid && !payload.token && !payload.hostname) {
    throw new Error("Dados do terminal incompletos para registro.");
  }

  const terminal = await findExistingAgentTerminal(payload);

  const data: Partial<Terminal> = {
    nome: payload.machineName || payload.hostname,
    identificador: payload.equipmentUuid || terminal?.identificador || payload.hostname,
    equipmentUuid: payload.equipmentUuid || terminal?.equipmentUuid,
    hostname: payload.hostname,
    sistemaOperacional: payload.sistemaOperacional,
    windowsVersion: payload.windowsVersion,
    arquitetura: payload.arquitetura,
    memoriaRamGb: payload.memoriaRamGb,
    processador: payload.processador,
    usuarioLogado: payload.usuarioLogado,
    ip: payload.ip,
    versaoAgente: payload.versaoAgente,
    resolucaoTela: payload.resolucaoTela,
    quantidadeMonitores: payload.quantidadeMonitores,
    empresaId: payload.empresaId,
    status: TerminalStatus.ONLINE,
    ultimaConexao: new Date(),
  };

  if (terminal) {
    Object.assign(terminal, data);
    if (payload.token) terminal.token = payload.token;
    await repo.save(terminal);
    return terminal;
  }

  const created = repo.create({
    ...data,
    token: payload.token ?? randomBytes(32).toString("hex"),
  });
  await repo.save(created);
  return created;
}

async function findExistingAgentTerminal(payload: TerminalRegisterPayload) {
  const repo = getRepository(Terminal);

  if (payload.token) {
    const byToken = await repo.findOne({ where: { token: payload.token } });
    if (byToken) return byToken;
  }

  if (payload.equipmentUuid) {
    const byUuid = await repo.findOne({ where: { equipmentUuid: payload.equipmentUuid } });
    if (byUuid) return byUuid;

    const byIdent = await repo.findOne({ where: { identificador: payload.equipmentUuid } });
    if (byIdent) return byIdent;
  }

  if (payload.hostname) {
    const byHostname = await repo.findOne({ where: { hostname: payload.hostname } });
    if (byHostname && !byHostname.userId) return byHostname;
  }

  return null;
}

export async function touchTerminalHeartbeat(token: string, ip?: string, usuarioLogado?: string) {
  await initializeDatabase();
  const repo = getRepository(Terminal);
  const terminal = await repo.findOne({ where: { token } });
  if (!terminal) return null;

  terminal.status = TerminalStatus.ONLINE;
  terminal.ultimaConexao = new Date();
  if (ip) terminal.ip = ip;
  if (usuarioLogado) terminal.usuarioLogado = usuarioLogado;
  await repo.save(terminal);
  return terminal;
}

export async function markTerminalOfflineByToken(token: string) {
  await initializeDatabase();
  const repo = getRepository(Terminal);
  const terminal = await repo.findOne({ where: { token } });
  if (!terminal) return null;

  terminal.status = TerminalStatus.OFFLINE;
  await repo.save(terminal);
  return terminal;
}

export async function markTerminalOfflineById(terminalId: string) {
  await initializeDatabase();
  const repo = getRepository(Terminal);
  const terminal = await repo.findOne({ where: { id: terminalId } });
  if (!terminal) return null;

  terminal.status = TerminalStatus.OFFLINE;
  await repo.save(terminal);
  return terminal;
}

export async function findTerminalByToken(token: string) {
  await initializeDatabase();
  return getRepository(Terminal).findOne({ where: { token } });
}

export type EnsureUserTerminalInput = {
  userId: string;
  userName: string;
  email: string;
  ip?: string;
  userAgent?: string | null;
  online?: boolean;
};

export async function ensureUserTerminal(input: EnsureUserTerminalInput) {
  if (!input.userId || !input.userName || !input.email) {
    throw new Error("Dados do usuário incompletos para criar o terminal.");
  }

  await initializeDatabase();
  const repo = getRepository(Terminal);
  const identificador = `user:${input.userId}`;

  const terminal = await findExistingUserTerminal(input.userId, identificador, input.email);

  const so = parseUserAgent(input.userAgent);
  const online = input.online !== false;
  const now = new Date();

  const data: Partial<Terminal> = {
    nome: input.userName,
    identificador,
    userId: input.userId,
    equipmentUuid: input.userId,
    hostname: input.email,
    usuarioLogado: input.userName,
    ip: input.ip || terminal?.ip,
    sistemaOperacional: so || terminal?.sistemaOperacional || "Web Browser",
    status: online ? TerminalStatus.ONLINE : (terminal?.status ?? TerminalStatus.OFFLINE),
    versaoAgente: terminal?.versaoAgente ?? "web-session",
  };

  if (online) {
    data.ultimaConexao = now;
  }

  if (terminal) {
    Object.assign(terminal, data);
    await repo.save(terminal);
    return { terminal, created: false as const };
  }

  const created = repo.create({
    ...data,
    token: randomBytes(32).toString("hex"),
  });
  await repo.save(created);
  return { terminal: created, created: true as const };
}

async function findExistingUserTerminal(userId: string, identificador: string, email: string) {
  const repo = getRepository(Terminal);

  const byUserId = await repo.findOne({ where: { userId } });
  if (byUserId) return byUserId;

  const byIdent = await repo.findOne({ where: { identificador } });
  if (byIdent) return byIdent;

  const byEquipment = await repo.findOne({ where: { equipmentUuid: userId } });
  if (byEquipment) return byEquipment;

  const byEmailHostname = await repo.findOne({ where: { hostname: email } });
  if (byEmailHostname?.userId === userId || byEmailHostname?.identificador === identificador) {
    return byEmailHostname;
  }

  return null;
}

export async function deleteTerminalById(terminalId: string) {
  await initializeDatabase();
  const terminalRepo = getRepository(Terminal);
  const sessaoRepo = getRepository(SessaoRemota);

  const terminal = await terminalRepo.findOne({ where: { id: terminalId } });
  if (!terminal) return null;

  await sessaoRepo.delete({ terminalId });
  await terminalRepo.remove(terminal);
  return terminal;
}

function parseUserAgent(userAgent?: string | null) {
  if (!userAgent) return undefined;
  if (/Windows NT 10/i.test(userAgent)) return "Windows 10/11";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac OS X/i.test(userAgent)) return "macOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad/i.test(userAgent)) return "iOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Web Browser";
}

export async function sweepStaleTerminals(timeoutMs: number) {
  await initializeDatabase();
  const repo = getRepository(Terminal);
  const cutoff = new Date(Date.now() - timeoutMs);

  const stale = await repo
    .createQueryBuilder("terminal")
    .where("terminal.status = :status", { status: TerminalStatus.ONLINE })
    .andWhere("(terminal.ultimaConexao IS NULL OR terminal.ultimaConexao < :cutoff)", { cutoff })
    .getMany();

  for (const terminal of stale) {
    terminal.status = TerminalStatus.OFFLINE;
    await repo.save(terminal);
  }

  return stale;
}
