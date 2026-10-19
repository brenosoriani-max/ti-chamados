import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { In } from "typeorm";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { Ticket } from "@/entities/Ticket";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketMessageRead } from "@/entities/TicketMessageRead";
import { messages } from "@/lib/messages";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await initializeDatabase();
    const { id } = await params;

    const ticketRepository = getRepository(Ticket);
    const ticket = await ticketRepository.findOne({ where: { id } });
    if (!ticket) return NextResponse.json({ error: messages.tickets.notFound }, { status: 404 });

    const messageRepository = getRepository(TicketMessage);
    const readRepository = getRepository(TicketMessageRead);

    const messagesList = await messageRepository.find({ where: { ticketId: id } });

    const messageIds = messagesList.map((m) => m.id);

    const reads = await readRepository.find({ where: { userId: session.id, messageId: In(messageIds) } });

    const unreadMessageIds = messagesList
      .filter((m) => m.authorId !== session.id && !reads.some((r) => r.messageId === m.id))
      .map((m) => m.id);

    return NextResponse.json({ unreadCount: unreadMessageIds.length, unreadMessageIds }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: messages.tickets.commentError }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await initializeDatabase();
    const { id } = await params;

    const body = await request.json();
    const messageIds: string[] = Array.isArray(body?.messageIds) ? body.messageIds : [];
    if (messageIds.length === 0) {
      return NextResponse.json({ error: "missing_message_ids" }, { status: 400 });
    }

    const ticketRepository = getRepository(Ticket);
    const ticket = await ticketRepository.findOne({ where: { id } });
    if (!ticket) return NextResponse.json({ error: messages.tickets.notFound }, { status: 404 });

    const messageRepository = getRepository(TicketMessage);
    const readRepository = getRepository(TicketMessageRead);

    const messagesList = await messageRepository.find({ where: { id: In(messageIds), ticketId: id } });

    // create reads only for messages that exist and aren't already marked
    const existingReads = await readRepository.find({ where: { userId: session.id, messageId: In(messagesList.map((m) => m.id)) } });
    const existingMessageIds = new Set(existingReads.map((r) => r.messageId));

    const toCreate = messagesList
      .filter((m) => m.authorId !== session.id && !existingMessageIds.has(m.id))
      .map((m) => readRepository.create({ messageId: m.id, userId: session.id }));

    if (toCreate.length > 0) {
      await readRepository.save(toCreate);
    }

    return NextResponse.json({ marked: toCreate.length }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: messages.tickets.commentError }, { status: 500 });
  }
}
