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

  await terminalRepository.save(terminal);
  return NextResponse.json({ ok: true, terminalId: terminal.id });
}
