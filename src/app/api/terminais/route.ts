import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { terminalCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  await requireSession();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));
  const query = searchParams.get("q")?.trim();

  const where = query
    ? {
        OR: [
          { nome: { contains: query } },
          { identificador: { contains: query } },
          { sistemaOperacional: { contains: query } },
          { ip: { contains: query } },
        ],
      }
    : {};

  const [terminais, total] = await Promise.all([
    prisma.terminal.findMany({
      where,
      orderBy: [{ status: "asc" }, { nome: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        sessoesRemotas: {
          where: { status: { in: ["AGUARDANDO", "CONECTANDO", "ATIVA"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { usuario: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.terminal.count({ where }),
  ]);

  return NextResponse.json({ terminais, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const body = await request.json();
  const parsed = terminalCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados do terminal invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const terminal = await prisma.terminal.create({
    data: {
      ...parsed.data,
      token: parsed.data.token ?? randomBytes(32).toString("hex"),
    },
  });

  return NextResponse.json(terminal, { status: 201 });
}
