import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function bearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = bearerToken(request) ?? body.token;

  if (!token && process.env.ALLOW_AGENT_AUTO_REGISTER !== "1") {
    return NextResponse.json({ error: "Token do terminal obrigatorio" }, { status: 401 });
  }

  const data = {
    nome: body.nome ?? body.hostname ?? body.identificador ?? "Terminal",
    identificador: body.identificador ?? body.hostname,
    sistemaOperacional: body.sistemaOperacional ?? body.platform,
    ip: body.ip,
    versaoAgente: body.versaoAgente,
    status: "ONLINE" as const,
    ultimaConexao: new Date(),
  };

  if (!data.identificador) {
    return NextResponse.json({ error: "Identificador obrigatorio" }, { status: 400 });
  }

  const terminal = token
    ? await prisma.terminal.update({
        where: { token },
        data,
      }).catch(() => null)
    : null;

  if (terminal) {
    return NextResponse.json({ terminal });
  }

  if (process.env.ALLOW_AGENT_AUTO_REGISTER !== "1") {
    return NextResponse.json({ error: "Terminal nao autorizado" }, { status: 403 });
  }

  const created = await prisma.terminal.upsert({
    where: { identificador: data.identificador },
    update: data,
    create: {
      ...data,
      token: token ?? randomBytes(32).toString("hex"),
    },
  });

  return NextResponse.json({ terminal: created }, { status: 201 });
}
