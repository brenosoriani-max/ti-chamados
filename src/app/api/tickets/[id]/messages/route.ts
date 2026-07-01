import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { messageCreateSchema } from "@/lib/validators";

/**
 * POST /api/tickets/[id]/messages
 * Add a message/comment to a ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const body = await request.json();
    const parsed = messageCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Internal comments are restricted to non-customers
    if (parsed.data.isInternal && session.role === Role.CLIENTE) {
      return NextResponse.json(
        { error: "Comentário interno restrito" },
        { status: 403 }
      );
    }

    // Verify ticket access
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        ...(session.role === Role.CLIENTE ? { customerId: session.id } : {}),
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Chamado não encontrado" },
        { status: 404 }
      );
    }

    // Create message and update ticket in a transaction
    const [message] = await prisma.$transaction([
      prisma.ticketMessage.create({
        data: {
          ticketId: id,
          authorId: session.id,
          body: parsed.data.body,
          isInternal: parsed.data.isInternal,
        },
        include: { author: true },
      }),
      prisma.ticket.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          history: {
            create: {
              actorId: session.id,
              action: "COMENTARIO",
              toValue: parsed.data.isInternal ? "interno" : "público",
            },
          },
        },
      }),
    ]);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao comentar" },
      { status: 500 }
    );
  }
}
