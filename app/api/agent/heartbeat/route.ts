import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function POST(request: NextRequest) {
  const token = bearerToken(request);

  if (!token) {
    return NextResponse.json({ error: "Token do terminal obrigatorio" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const terminal = await prisma.terminal.update({
    where: { token },
    data: {
      status: "ONLINE",
      ultimaConexao: new Date(),
      ip: body.ip,
      versaoAgente: body.versaoAgente,
      sistemaOperacional: body.sistemaOperacional,
    },
  }).catch(() => null);

  if (!terminal) {
    return NextResponse.json({ error: "Terminal nao autorizado" }, { status: 403 });
  }

  return NextResponse.json({ ok: true, terminalId: terminal.id });
}
