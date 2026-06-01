import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const sessions = await prisma.remoteSession.findMany({
    include: {
      equipment: true,
      requestedBy: true,
      ticket: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json(sessions);
}
