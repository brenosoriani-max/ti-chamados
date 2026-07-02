import "reflect-metadata";
import { NextResponse } from "next/server";
import { Role, TicketStatus } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { Ticket } from "@/entities/Ticket";

export async function GET() {
  try {
    await requireSession([Role.ADMIN, Role.TECNICO]);
    await initializeDatabase();

    const ticketRepository = getRepository(Ticket);

    const [byStatus, byPriority, byCategory, overdue, total] = await Promise.all([
      ticketRepository
        .createQueryBuilder("ticket")
        .select("ticket.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("ticket.status")
        .getRawMany(),
      ticketRepository
        .createQueryBuilder("ticket")
        .select("ticket.prioridade", "priority")
        .addSelect("COUNT(*)", "count")
        .groupBy("ticket.prioridade")
        .getRawMany(),
      ticketRepository
        .createQueryBuilder("ticket")
        .select("ticket.categoryId", "categoryId")
        .addSelect("COUNT(*)", "count")
        .groupBy("ticket.categoryId")
        .getRawMany(),
      ticketRepository
        .createQueryBuilder("ticket")
        .where("ticket.slaDueAt < :now", { now: new Date() })
        .andWhere("ticket.status NOT IN (:...closedStatuses)", {
          closedStatuses: [TicketStatus.ENCERRADO, TicketStatus.CANCELADO],
        })
        .getCount(),
      ticketRepository.count(),
    ]);

    return NextResponse.json({
      byStatus: byStatus.map((row) => ({ status: row.status, _count: Number(row.count) })),
      byPriority: byPriority.map((row) => ({ priority: row.priority, _count: Number(row.count) })),
      byCategory: byCategory.map((row) => ({ categoryId: row.categoryId, _count: Number(row.count) })),
      overdue,
      total,
      ratingAverage: 0,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 });
  }
}
