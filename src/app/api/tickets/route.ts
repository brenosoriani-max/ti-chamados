import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ticketCreateSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";

/**
 * GET /api/tickets
 * List tickets with filtering, search, and pagination
 * Query params: q (search), status (filter), page (default 1), take (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const q = searchParams.get("q") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(Number(searchParams.get("page") ?? 1), 1);
    const take = Math.min(Number(searchParams.get("take") ?? 20), 100);

    const where = {
      ...(session.role === Role.CLIENTE ? { customerId: session.id } : {}),
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: "insensitive" as const } },
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          customer: true,
          assignee: true,
          category: true,
          subCategory: true,
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * take,
        take,
      }),
      prisma.ticket.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, take });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao listar chamados" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const parsed = ticketCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ticket data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dueDates = await getDueDates(parsed.data.priority);
    const ticket = await prisma.ticket.create({
      data: {
        ...parsed.data,
        number: await nextTicketNumber(),
        customerId: session.id,
        ...dueDates,
        history: {
          create: {
            actorId: session.id,
            action: "CRIACAO",
            toValue: "ABERTO",
          },
        },
      },
      include: {
        category: true,
        customer: true,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao criar chamado" },
      { status: 500 }
    );
  }
}
