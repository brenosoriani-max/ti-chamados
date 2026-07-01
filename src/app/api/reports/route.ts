import { NextResponse } from "next/server";
import { Role } from "@/types";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";

/**
 * GET /api/reports
 * Retrieve analytics and dashboard statistics (ADMIN and TECNICO only)
 */
export async function GET() {
  try {
    await requireSession([Role.ADMIN, Role.TECNICO]);

    const [
      byStatus,
      byPriority,
      byCategory,
      overdue,
      total,
      ratings,
    ] = await Promise.all([
      prisma.ticket.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.ticket.groupBy({
        by: ["priority"],
        _count: true,
      }),
      prisma.ticket.groupBy({
        by: ["categoryId"],
        _count: true,
      }),
      prisma.ticket.count({
        where: {
          slaDueAt: { lt: new Date() },
          status: { notIn: ["ENCERRADO", "CANCELADO"] },
        },
      }),
      prisma.ticket.count(),
      prisma.rating.aggregate({
        _avg: { score: true },
      }),
    ]);

    return NextResponse.json({
      byStatus,
      byPriority,
      byCategory,
      overdue,
      total,
      ratingAverage: ratings._avg.score ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
