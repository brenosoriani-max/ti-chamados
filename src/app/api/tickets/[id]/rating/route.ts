import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role, HistoryAction } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { ratingSchema } from "@/lib/validators";
import { Ticket } from "@/entities/Ticket";
import { TicketHistory } from "@/entities/TicketHistory";
import { messages } from "@/lib/messages";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession([Role.CLIENTE]);
    await initializeDatabase();
    const { id } = await params;

    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: messages.tickets.invalidRating, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ticketRepository = getRepository(Ticket);
    const ticket = await ticketRepository.findOne({
      where: { id, clienteId: session.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: messages.tickets.notFound }, { status: 404 });
    }

    const historyRepository = getRepository(TicketHistory);
    const history = historyRepository.create({
      ticketId: id,
      actorId: session.id,
      action: HistoryAction.AVALIACAO,
      toValue: String(parsed.data.score),
      metadata: parsed.data.comment,
    });
    await historyRepository.save(history);

    return NextResponse.json({
      ticketId: id,
      score: parsed.data.score,
      comment: parsed.data.comment ?? null,
    });
  } catch {
    return NextResponse.json({ error: messages.tickets.ratingError }, { status: 500 });
  }
}
