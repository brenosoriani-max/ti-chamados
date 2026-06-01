import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { messageCreateSchema } from "@/lib/validators";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const parsed = messageCreateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    if (parsed.data.isInternal && session.role === Role.CLIENTE) return NextResponse.json({ error: "Comentario interno restrito" }, { status: 403 });

    const ticket = await prisma.ticket.findFirst({ where: { id, ...(session.role === Role.CLIENTE ? { customerId: session.id } : {}) } });
    if (!ticket) return NextResponse.json({ error: "Chamado nao encontrado" }, { status: 404 });

    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId: id,
          authorId: session.id,
          body: parsed.data.body,
          isInternal: parsed.data.isInternal
        },
        include: { author: true }
      }),
      prisma.ticket.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          history: { create: { actorId: session.id, action: "COMENTARIO", toValue: parsed.data.isInternal ? "interno" : "publico" } }
        }
      })
    ]);
    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    return NextResponse.json({ error: "Erro ao comentar" }, { status: 500 });
  }
}
