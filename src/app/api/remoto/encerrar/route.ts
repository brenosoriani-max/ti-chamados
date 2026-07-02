import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role, SessaoRemotaStatus } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { remoteEndSchema } from "@/lib/validators";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { appendRemoteLog } from "@/lib/remote-logs";

export async function POST(request: NextRequest) {
  const usuario = await requireSession([Role.TECNICO, Role.ADMIN]);
  await initializeDatabase();

  const parsed = remoteEndSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados da sessao invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const sessaoRepository = getRepository(SessaoRemota);
  const current = await sessaoRepository.findOne({ where: { id: parsed.data.sessaoId } });

  if (!current) {
    return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
  }

  if (usuario.role !== Role.ADMIN && current.usuarioId !== usuario.id) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  current.status = SessaoRemotaStatus.ENCERRADA;
  current.encerradaEm = new Date();
  current.logs = appendRemoteLog(current.logs, {
    action: "sessao:end",
    usuarioId: usuario.id,
    at: new Date().toISOString(),
  });
  await sessaoRepository.save(current);

  const sessao = await sessaoRepository.findOne({
    where: { id: current.id },
    relations: ["terminal", "usuario"],
  });

  return NextResponse.json(sessao);
}
