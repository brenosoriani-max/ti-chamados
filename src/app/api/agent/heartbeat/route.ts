import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { TerminalStatus } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { Terminal } from "@/entities/Terminal";

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function POST(request: NextRequest) {
  await initializeDatabase();

  const token = bearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Token do terminal obrigatorio" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const terminalRepository = getRepository(Terminal);
  const terminal = await terminalRepository.findOne({ where: { token } });

  if (!terminal) {
    return NextResponse.json({ error: "Terminal nao autorizado" }, { status: 403 });
  }

  terminal.status = TerminalStatus.ONLINE;
  terminal.ultimaConexao = new Date();
  if (body.ip) terminal.ip = body.ip;
  if (body.versaoAgente) terminal.versaoAgente = body.versaoAgente;
  if (body.sistemaOperacional) terminal.sistemaOperacional = body.sistemaOperacional;
  if (body.hostname) terminal.hostname = body.hostname;
  if (body.machineName) terminal.hostname = body.machineName;
  if (body.identificador) terminal.identificador = body.identificador;
  if (body.equipmentUuid) terminal.equipmentUuid = body.equipmentUuid;
  if (body.usuarioLogado) terminal.usuarioLogado = body.usuarioLogado;
  if (body.processador) terminal.processador = body.processador;
  if (body.memoriaRamGb) terminal.memoriaRamGb = Number(body.memoriaRamGb);
  if (body.quantidadeMonitores) terminal.quantidadeMonitores = Number(body.quantidadeMonitores);
  if (body.arquitetura) terminal.arquitetura = body.arquitetura;
  if (body.windowsVersion) terminal.windowsVersion = body.windowsVersion;

  await terminalRepository.save(terminal);
  return NextResponse.json({ ok: true, terminalId: terminal.id });
}
