import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role, TicketStatus, HistoryAction } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { ticketCreateSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";
import { Ticket } from "@/entities/Ticket";
import { TicketHistory } from "@/entities/TicketHistory";
import { Brackets } from "typeorm";
import { messages } from "@/lib/messages";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const requestedPage = Number(searchParams.get("page") ?? 1);
    const requestedTake = Number(searchParams.get("take") ?? 20);
    const page = Number.isFinite(requestedPage) ? Math.max(Math.floor(requestedPage), 1) : 1;
    const take = Number.isFinite(requestedTake) ? Math.min(Math.max(Math.floor(requestedTake), 1), 100) : 20;

    const ticketRepository = getRepository(Ticket);
    const qb = ticketRepository
      .createQueryBuilder("ticket")
      .leftJoin("ticket.cliente", "cliente")
      .leftJoin("ticket.responsavel", "responsavel")
      .leftJoin("ticket.category", "category")
      .leftJoin("ticket.subCategory", "subCategory")
      .addSelect([
        "cliente.id", "cliente.name", "cliente.email",
        "responsavel.id", "responsavel.name", "responsavel.email",
        "category.id", "category.name", "subCategory.id", "subCategory.name",
      ]);

    if (session.role === Role.CLIENTE) {
      qb.andWhere("ticket.clienteId = :clienteId", { clienteId: session.id });
    }

    if (status) {
      qb.andWhere("ticket.status = :status", { status });
    }

    if (q) {
      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where("ticket.protocolo LIKE :q", { q: `%${q}%` })
            .orWhere("ticket.titulo LIKE :q", { q: `%${q}%` })
            .orWhere("ticket.descricao LIKE :q", { q: `%${q}%` });
        })
      );
    }

    const [items, total] = await qb
      .orderBy("ticket.updatedAt", "DESC")
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    return NextResponse.json({ items, total, page, take });
  } catch {
    return NextResponse.json({ error: messages.tickets.listError }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    await initializeDatabase();

    const body = await request.json();
    const parsed = ticketCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: messages.tickets.invalidData, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dueDates = await getDueDates(parsed.data.priority);
    const ticketRepository = getRepository(Ticket);
    const ticketHistoryRepository = getRepository(TicketHistory);

    const ticket = ticketRepository.create({
      protocolo: await nextTicketNumber(),
      titulo: parsed.data.title,
      descricao: parsed.data.description,
      categoryId: parsed.data.categoryId,
      subCategoryId: parsed.data.subCategoryId || undefined,
      prioridade: parsed.data.priority,
      status: TicketStatus.ABERTO,
      clienteId: session.id,
      ...dueDates,
    });
    await ticketRepository.save(ticket);

    const history = ticketHistoryRepository.create({
      ticketId: ticket.id,
      actorId: session.id,
      action: HistoryAction.CRIACAO,
      toValue: TicketStatus.ABERTO,
    });
    await ticketHistoryRepository.save(history);

    const saved = await ticketRepository.findOne({
      where: { id: ticket.id },
      relations: ["category", "cliente"],
    });

    return NextResponse.json(saved, { status: 201 });
  } catch {
    return NextResponse.json({ error: messages.tickets.createError }, { status: 500 });
  }
}
