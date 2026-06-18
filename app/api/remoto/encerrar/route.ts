import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { remoteEndSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const usuario = await requireSession([Role.TECNICO, Role.ADMIN]);
  const parsed = remoteEndSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados da sessao invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const current = await prisma.sessaoRemota.findUnique({
    where: { id: parsed.data.sessaoId },
  });

  if (!current) {
    return NextResponse.json({ error: "Sessao nao encontrada" }, { status: 404 });
  }

  if (usuario.role !== Role.ADMIN && current.usuarioId !== usuario.id) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  const sessao = await prisma.sessaoRemota.update({
    where: { id: current.id },
    data: {
      status: "ENCERRADA",
      encerradaEm: new Date(),
      logs: [
        ...((current.logs as any[]) ?? []),
        {
          action: "sessao:end",
          usuarioId: usuario.id,
          at: new Date().toISOString(),
        },
      ],
    },
    include: {
      terminal: true,
      usuario: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(sessao);
}
