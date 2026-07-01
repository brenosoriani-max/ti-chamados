import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { remoteStartSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const usuario = await requireSession([Role.TECNICO, Role.ADMIN]);
  const parsed = remoteStartSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados da sessao invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const terminal = await prisma.terminal.findUnique({
    where: { id: parsed.data.terminalId },
  });

  if (!terminal) {
    return NextResponse.json({ error: "Terminal nao encontrado" }, { status: 404 });
  }

  if (terminal.status !== "ONLINE") {
    return NextResponse.json({ error: "Terminal offline" }, { status: 409 });
  }

  const sessao = await prisma.sessaoRemota.create({
    data: {
      terminalId: terminal.id,
      usuarioId: usuario.id,
      status: "AGUARDANDO",
      logs: [
        {
          action: "sessao:create",
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

  return NextResponse.json(sessao, { status: 201 });
}
