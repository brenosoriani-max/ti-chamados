import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ratingSchema } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession([Role.CLIENTE]);
    const { id } = await params;
    const parsed = ratingSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const ticket = await prisma.ticket.findFirst({ where: { id, customerId: session.id } });
    if (!ticket) return NextResponse.json({ error: "Chamado nao encontrado" }, { status: 404 });
    const rating = await prisma.rating.upsert({
      where: { ticketId: id },
      update: parsed.data,
      create: { ticketId: id, authorId: session.id, ...parsed.data }
    });
    await prisma.ticketHistory.create({ data: { ticketId: id, actorId: session.id, action: "AVALIACAO", toValue: String(parsed.data.score) } });
    return NextResponse.json(rating);
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Erro ao avaliar" }, { status: 500 });
  }
}
