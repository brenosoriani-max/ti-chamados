import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role, HistoryAction } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { ticketUpdateSchema } from "@/lib/validators";
import { Ticket } from "@/entities/Ticket";
import { TicketHistory } from "@/entities/TicketHistory";
import { TicketMessage } from "@/entities/TicketMessage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    await initializeDatabase();
    const { id } = await params;

    const ticketRepository = getRepository(Ticket);
    const ticket = await ticketRepository.findOne({
      where: {
        id,
        ...(session.role === Role.CLIENTE ? { clienteId: session.id } : {}),
      },
      relations: [
        "cliente",
        "responsavel",
        "category",
        "subCategory",
        "equipment",
        "attachments",
        "messages",
        "messages.author",
        "messages.attachments",
        "history",
        "history.actor",
      ],
    });

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
    }

    ticket.messages.sort((a: TicketMessage, b: TicketMessage) => a.createdAt.getTime() - b.createdAt.getTime());
    ticket.history.sort((a: TicketHistory, b: TicketHistory) => a.createdAt.getTime() - b.createdAt.getTime());

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Erro ao consultar chamado" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession([Role.TECNICO, Role.ADMIN]);
    await initializeDatabase();
    const { id } = await params;

    const body = await request.json();
    const parsed = ticketUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ticket data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const ticketRepository = getRepository(Ticket);
    const ticketHistoryRepository = getRepository(TicketHistory);

    const current = await ticketRepository.findOne({ where: { id } });
    if (!current) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 });
    }

    const oldStatus = current.status;
    const oldPriority = current.prioridade;
    const oldAssigneeId = current.responsavelId ?? null;

    if (parsed.data.title !== undefined) current.titulo = parsed.data.title;
    if (parsed.data.description !== undefined) current.descricao = parsed.data.description;
    if (parsed.data.status !== undefined) {
      current.status = parsed.data.status;
      if (parsed.data.status === "RESOLVIDO") current.resolvedAt = new Date();
      if (parsed.data.status === "ENCERRADO") current.closedAt = new Date();
    }
    if (parsed.data.priority !== undefined) current.prioridade = parsed.data.priority;
    if (parsed.data.assigneeId !== undefined) current.responsavelId = parsed.data.assigneeId ?? undefined;

    await ticketRepository.save(current);

    const histories: Partial<TicketHistory>[] = [];

    if (parsed.data.status && parsed.data.status !== oldStatus) {
      histories.push({
        ticketId: id,
        actorId: session.id,
        action: HistoryAction.MUDANCA_STATUS,
        fromValue: oldStatus,
        toValue: parsed.data.status,
      });
    }

    if (parsed.data.priority && parsed.data.priority !== oldPriority) {
      histories.push({
        ticketId: id,
        actorId: session.id,
        action: HistoryAction.MUDANCA_PRIORIDADE,
        fromValue: oldPriority,
        toValue: parsed.data.priority,
      });
    }

    if (parsed.data.assigneeId !== undefined && parsed.data.assigneeId !== oldAssigneeId) {
      histories.push({
        ticketId: id,
        actorId: session.id,
        action: HistoryAction.TROCA_RESPONSAVEL,
        fromValue: oldAssigneeId ?? undefined,
        toValue: parsed.data.assigneeId ?? "Nenhum",
      });
    }

    if (histories.length > 0) {
      await ticketHistoryRepository.save(histories.map((h) => ticketHistoryRepository.create(h)));
    }

    const ticket = await ticketRepository.findOne({
      where: { id },
      relations: ["cliente", "responsavel", "category"],
    });

    return NextResponse.json(ticket);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar chamado" }, { status: 500 });
  }
}
