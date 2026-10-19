import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { In } from "typeorm";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketMessageRead } from "@/entities/TicketMessageRead";
import { messages } from "@/lib/messages";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    await initializeDatabase();

    const body = await request.json();
    const ticketIds: string[] = Array.isArray(body?.ticketIds) ? body.ticketIds : [];
    if (ticketIds.length === 0) {
      return NextResponse.json({ error: "missing_ticket_ids" }, { status: 400 });
    }

    const messageRepository = getRepository(TicketMessage);
    const readRepository = getRepository(TicketMessageRead);

    const messagesList = await messageRepository.find({ where: { ticketId: In(ticketIds) } });
    const messageIds = messagesList.map((m) => m.id);

    const reads = await readRepository.find({ where: { userId: session.id, messageId: In(messageIds) } });

    const unreadPerTicket: Record<string, boolean> = {};
    for (const tid of ticketIds) unreadPerTicket[tid] = false;

    for (const m of messagesList) {
      if (m.authorId === session.id) continue;
      const readExists = reads.some((r) => r.messageId === m.id);
      if (!readExists) unreadPerTicket[m.ticketId] = true;
    }

    return NextResponse.json({ unread: unreadPerTicket }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: messages.tickets.commentError }, { status: 500 });
  }
}
