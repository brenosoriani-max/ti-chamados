import "reflect-metadata";
import { randomBytes } from "crypto";
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

  const body = await request.json();
  const token = bearerToken(request) ?? body.token;

  if (!token && process.env.ALLOW_AGENT_AUTO_REGISTER !== "1") {
    return NextResponse.json({ error: "Token do terminal obrigatorio" }, { status: 401 });
  }

  const incomingIdentifier = body.identificador ?? body.hostname ?? body.machineName ?? body.nome ?? body.equipmentUuid;
  const data = {
    nome: body.nome ?? body.hostname ?? body.machineName ?? incomingIdentifier ?? "Terminal",
    identificador: incomingIdentifier ?? `terminal-${randomBytes(32).toString("hex")}`,
    hostname: body.hostname ?? body.machineName ?? body.nome ?? undefined,
    equipmentUuid: body.equipmentUuid ?? undefined,
    sistemaOperacional: body.sistemaOperacional ?? body.platform,
    ip: body.ip,
    versaoAgente: body.versaoAgente,
    status: TerminalStatus.ONLINE,
    ultimaConexao: new Date(),
  };

  if (!data.identificador) {
    return NextResponse.json({ error: "Identificador obrigatorio" }, { status: 400 });
  }

  const terminalRepository = getRepository(Terminal);

  if (token) {
    const existing = await terminalRepository.findOne({ where: { token } });
    if (existing) {
      Object.assign(existing, data, {
        nome: existing.nome || data.nome,
        identificador: existing.identificador || data.identificador,
      });
      await terminalRepository.save(existing);
      return NextResponse.json({ terminal: existing });
    }
  }

  if (process.env.ALLOW_AGENT_AUTO_REGISTER !== "1") {
    return NextResponse.json({ error: "Terminal nao autorizado" }, { status: 403 });
  }

  let terminal = await terminalRepository.findOne({
    where: [{ identificador: data.identificador }, { equipmentUuid: data.equipmentUuid ?? undefined }],
  });

  if (terminal) {
    Object.assign(terminal, data, {
      nome: terminal.nome || data.nome,
      identificador: terminal.identificador || data.identificador,
    });
  } else {
    terminal = terminalRepository.create({
      ...data,
      token: token ?? randomBytes(32).toString("hex"),
    });
  }

  await terminalRepository.save(terminal);
  return NextResponse.json({ terminal }, { status: 201 });
}
