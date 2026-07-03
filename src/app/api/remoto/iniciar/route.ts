import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role, SessaoRemotaStatus } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { remoteStartSchema } from "@/lib/validators";
import { Terminal } from "@/entities/Terminal";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { appendRemoteLog } from "@/lib/remote-logs";
import { emitToTerminal, emitToSession, mapSessionTerminal } from "@/lib/remote/socket-bridge";
import { remoteSocketEvents } from "@/lib/remote/events";

export async function POST(request: NextRequest) {
  const usuario = await requireSession([Role.TECNICO, Role.ADMIN]);
  await initializeDatabase();

  const parsed = remoteStartSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados da sessao invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const terminalRepository = getRepository(Terminal);
  const terminal = await terminalRepository.findOne({ where: { id: parsed.data.terminalId } });

  if (!terminal) {
    return NextResponse.json({ error: "Terminal nao encontrado" }, { status: 404 });
  }

  if (terminal.status !== "ONLINE") {
    return NextResponse.json({ error: "Terminal offline" }, { status: 409 });
  }

  const sessaoRepository = getRepository(SessaoRemota);
  const sessao = sessaoRepository.create({
    terminalId: terminal.id,
    usuarioId: usuario.id,
    status: SessaoRemotaStatus.AGUARDANDO,
    logs: appendRemoteLog(null, {
      action: "sessao:create",
      usuarioId: usuario.id,
      at: new Date().toISOString(),
    }),
  });
  await sessaoRepository.save(sessao);

  const saved = await sessaoRepository.findOne({
    where: { id: sessao.id },
    relations: ["terminal", "usuario"],
  });

  mapSessionTerminal(sessao.id, terminal.id);
  emitToTerminal(terminal.id, remoteSocketEvents.sessionCreate, {
    sessaoId: sessao.id,
    terminalId: terminal.id,
    usuarioId: usuario.id,
    usuarioNome: usuario.name,
  });
  emitToSession(sessao.id, remoteSocketEvents.sessionState, {
    sessaoId: sessao.id,
    status: SessaoRemotaStatus.AGUARDANDO,
  });

  return NextResponse.json(saved, { status: 201 });
}
