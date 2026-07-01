import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ticketUpdateSchema } from "@/lib/validators";

/**
 * GET /api/tickets/[id]
 * Retrieve ticket details with all related data (messages, attachments, history, etc.)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        ...(session.role === Role.CLIENTE ? { customerId: session.id } : {}),
      },
      include: {
        customer: true,
        assignee: true,
        category: true,
        subCategory: true,
        equipment: true,
        attachments: true,
        rating: true,
        messages: {
          include: {
            author: true,
            attachments: true,
          },
          orderBy: { createdAt: "asc" },
        },
        history: {
          include: { actor: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Chamado não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao consultar chamado" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tickets/[id]
 * Update ticket information (status, priority, assignee, etc.)
 * Only TECNICO and ADMIN roles can update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession([Role.TECNICO, Role.ADMIN]);
    const { id } = await params;

    const body = await request.json();
    const parsed = ticketUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ticket data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const current = await prisma.ticket.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json(
        { error: "Chamado não encontrado" },
        { status: 404 }
      );
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...parsed.data,
        resolvedAt:
          parsed.data.status === "RESOLVIDO" ? new Date() : undefined,
        closedAt: parsed.data.status === "ENCERRADO" ? new Date() : undefined,
        history: {
          create: [
            ...(parsed.data.status && parsed.data.status !== current.status
              ? [
                  {
                    actorId: session.id,
                    action: "MUDANCA_STATUS" as const,
                    fromValue: current.status,
                    toValue: parsed.data.status,
                  },
                ]
              : []),
            ...(parsed.data.priority &&
            parsed.data.priority !== current.priority
              ? [
                  {
                    actorId: session.id,
                    action: "MUDANCA_PRIORIDADE" as const,
                    fromValue: current.priority,
                    toValue: parsed.data.priority,
                  },
                ]
              : []),
            ...(parsed.data.assigneeId !== undefined &&
            parsed.data.assigneeId !== current.assigneeId
              ? [
                  {
                    actorId: session.id,
                    action: "TROCA_RESPONSAVEL" as const,
                    fromValue: current.assigneeId,
                    toValue: parsed.data.assigneeId,
                  },
                ]
              : []),
          ],
        },
      },
      include: {
        customer: true,
        assignee: true,
        category: true,
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao atualizar chamado" },
      { status: 500 }
    );
  }
}
