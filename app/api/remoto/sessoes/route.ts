import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const { searchParams } = new URL(request.url);
  const terminalId = searchParams.get("terminalId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const sessoes = await prisma.sessaoRemota.findMany({
    where: {
      ...(terminalId ? { terminalId } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: {
      terminal: true,
      usuario: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ sessoes });
}
