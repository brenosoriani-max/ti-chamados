import "reflect-metadata";
import { randomBytes } from "crypto";
import { getRepository, initializeDatabase } from "@/lib/database";
import { Terminal } from "@/entities/Terminal";
import { TerminalStatus } from "@/types";
import type { TerminalRegisterPayload } from "@/lib/remote/events";

export async function registerOrUpdateTerminal(payload: TerminalRegisterPayload) {
  await initializeDatabase();
  const repo = getRepository(Terminal);

  let terminal = payload.token
    ? await repo.findOne({ where: { token: payload.token } })
    : null;

  if (!terminal && payload.equipmentUuid) {
    terminal = await repo.findOne({ where: { equipmentUuid: payload.equipmentUuid } });
  }

  const data = {
    nome: payload.machineName || payload.hostname,
    identificador: payload.equipmentUuid,
    equipmentUuid: payload.equipmentUuid,
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
  } else {
    terminal = repo.create({
      ...data,
      token: payload.token ?? randomBytes(32).toString("hex"),
    });
  }

  await repo.save(terminal);
  return terminal;
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
