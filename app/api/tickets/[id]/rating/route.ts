import { NextRequest, NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { ratingSchema } from "@/lib/validators";

/**
 * POST /api/tickets/[id]/rating
 * Create or update a ticket rating (CLIENTE only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession([Role.CLIENTE]);
    const { id } = await params;

    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid rating data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify ticket ownership
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        customerId: session.id,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Chamado não encontrado" },
        { status: 404 }
      );
    }

    // Create or update rating
    const rating = await prisma.rating.upsert({
      where: { ticketId: id },
      update: parsed.data,
      create: {
        ticketId: id,
        authorId: session.id,
        ...parsed.data,
      },
    });

    // Record rating in history
    await prisma.ticketHistory.create({
      data: {
        ticketId: id,
        actorId: session.id,
        action: "AVALIACAO",
        toValue: String(parsed.data.score),
      },
    });

    return NextResponse.json(rating);
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao avaliar" },
      { status: 500 }
    );
  }
}
