import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { terminalUpdateSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  await requireSession();
  const { id } = await params;

  const terminal = await prisma.terminal.findUnique({
    where: { id },
    include: {
      sessoesRemotas: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { usuario: { select: { id: true, name: true } } },
      },
    },
  });

  if (!terminal) {
    return NextResponse.json({ error: "Terminal nao encontrado" }, { status: 404 });
  }

  return NextResponse.json(terminal);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  const { id } = await params;

  const parsed = terminalUpdateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados do terminal invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const terminal = await prisma.terminal.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(terminal);
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  const { id } = await params;

  await prisma.terminal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
