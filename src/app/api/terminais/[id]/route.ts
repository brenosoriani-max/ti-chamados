import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { terminalUpdateSchema } from "@/lib/validators";
import { Terminal } from "@/entities/Terminal";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { messages } from "@/lib/messages";
import { deleteTerminalById } from "@/lib/remote/services/terminal-service";
import { emitTerminalUpdated } from "@/lib/remote/socket-bridge";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  await requireSession();
  await initializeDatabase();
  const { id } = await params;

  const terminalRepository = getRepository(Terminal);
  const terminal = await terminalRepository.findOne({
    where: { id },
    relations: ["sessoesRemotas", "sessoesRemotas.usuario"],
  });

  if (!terminal) {
    return NextResponse.json({ error: messages.terminais.notFound }, { status: 404 });
  }

  terminal.sessoesRemotas = terminal.sessoesRemotas
    .sort((a: SessaoRemota, b: SessaoRemota) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((sessao: SessaoRemota) => ({
      ...sessao,
      usuario: sessao.usuario ? { id: sessao.usuario.id, name: sessao.usuario.name } : null,
    })) as typeof terminal.sessoesRemotas;

  return NextResponse.json(terminal);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  await initializeDatabase();
  const { id } = await params;

  const parsed = terminalUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: messages.terminais.invalidData, details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const terminalRepository = getRepository(Terminal);
  const terminal = await terminalRepository.findOne({ where: { id } });
  if (!terminal) {
    return NextResponse.json({ error: messages.terminais.notFound }, { status: 404 });
  }

  Object.assign(terminal, parsed.data);
  await terminalRepository.save(terminal);

  return NextResponse.json(terminal);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireSession([Role.TECNICO, Role.ADMIN]);
    const { id } = await params;

    const deleted = await deleteTerminalById(id);
    if (!deleted) {
      return NextResponse.json({ error: messages.terminais.notFound }, { status: 404 });
    }

    emitTerminalUpdated({ id, deleted: true, status: "OFFLINE" });

    return NextResponse.json({ ok: true, message: messages.terminais.deleteSuccess });
  } catch {
    return NextResponse.json({ error: messages.terminais.deleteError }, { status: 500 });
  }
}
