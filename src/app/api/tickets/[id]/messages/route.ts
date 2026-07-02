import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role, HistoryAction } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { messageCreateSchema } from "@/lib/validators";
import { Ticket } from "@/entities/Ticket";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketHistory } from "@/entities/TicketHistory";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await initializeDatabase();
    const { id } = await params;

    const body = await request.json();
    const parsed = messageCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid message data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.isInternal && session.role === Role.CLIENTE) {
      return NextResponse.json({ error: "Comentário interno restrito" }, { status: 403 });
    }

    const ticketRepository = getRepository(Ticket);
    const ticket = await ticketRepository.findOne({
      where: {
        id,
        ...(session.role === Role.CLIENTE ? { clienteId: session.id } : {}),
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
    }

    const messageRepository = getRepository(TicketMessage);
    const historyRepository = getRepository(TicketHistory);

    const message = messageRepository.create({
      ticketId: id,
      authorId: session.id,
      body: parsed.data.body,
      isInternal: parsed.data.isInternal,
    });
    await messageRepository.save(message);

    ticket.updatedAt = new Date();
    await ticketRepository.save(ticket);

    const history = historyRepository.create({
      ticketId: id,
      actorId: session.id,
      action: HistoryAction.COMENTARIO,
      toValue: parsed.data.isInternal ? "interno" : "público",
    });
    await historyRepository.save(history);

    const saved = await messageRepository.findOne({
      where: { id: message.id },
      relations: ["author"],
    });

    return NextResponse.json(saved, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao comentar" }, { status: 500 });
  }
}
