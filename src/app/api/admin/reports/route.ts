import { NextRequest, NextResponse } from "next/server";
import { getRepository, initializeDatabase } from "@/lib/database";
import { Ticket } from "@/entities/Ticket";
import { User } from "@/entities/User";
import { requireSession } from "@/lib/auth";
import { Role, TicketStatus, HistoryAction } from "@/types";
import { TicketHistory } from "@/entities/TicketHistory";
import { Not, In } from "typeorm";

export async function GET(request: NextRequest) {
  try {
    await requireSession([Role.ADMIN]);
    await initializeDatabase();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30"; // days
    const periodDays = Math.min(Math.max(parseInt(period, 10), 1), 365);

    const since = new Date();
    since.setDate(since.getDate() - periodDays);

    const ticketRepo = getRepository(Ticket);
    const userRepo = getRepository(User);
    const historyRepo = getRepository(TicketHistory);

    const [
      totalInPeriod,
      resolvedInPeriod,
      openCount,
      slaViolatedCount,
      slaOkCount,
      categoryRows,
      techRows,
      avgResolutionRow,
      ratingRow,
      dailyRows,
    ] = await Promise.all([
      // Total tickets in period
      ticketRepo
        .createQueryBuilder("t")
        .where("t.createdAt >= :since", { since })
        .getCount(),

      // Resolved in period
      ticketRepo
        .createQueryBuilder("t")
        .where("t.status = :status", { status: TicketStatus.RESOLVIDO })
        .andWhere("t.resolvedAt >= :since", { since })
        .getCount(),

      // Currently open tickets
      ticketRepo.count({
        where: {
          status: Not(In([TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO])),
          isArchived: false,
        },
      }),

      // SLA violated (overdue open)
      ticketRepo
        .createQueryBuilder("t")
        .where("t.slaDueAt < NOW()")
        .andWhere("t.status NOT IN (:...statuses)", {
          statuses: [TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO],
        })
        .andWhere("t.isArchived = :archived", { archived: false })
        .getCount(),

      // SLA ok (open, within deadline)
      ticketRepo
        .createQueryBuilder("t")
        .where("t.slaDueAt >= NOW()")
        .andWhere("t.status NOT IN (:...statuses)", {
          statuses: [TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO],
        })
        .andWhere("t.isArchived = :archived", { archived: false })
        .getCount(),

      // Tickets by category in period
      ticketRepo
        .createQueryBuilder("t")
        .leftJoin("t.category", "cat")
        .select("cat.id", "categoryId")
        .addSelect("cat.name", "categoryName")
        .addSelect("COUNT(t.id)", "total")
        .addSelect("SUM(CASE WHEN t.status = 'RESOLVIDO' THEN 1 ELSE 0 END)", "resolved")
        .where("t.createdAt >= :since", { since })
        .groupBy("cat.id")
        .addGroupBy("cat.name")
        .orderBy("total", "DESC")
        .getRawMany(),

      // Workload by technician (open tickets currently assigned)
      userRepo
        .createQueryBuilder("u")
        .leftJoin("u.ticketsAtendidos", "t", "t.isArchived = false AND t.status NOT IN ('RESOLVIDO','ENCERRADO','CANCELADO')")
        .where("u.role IN (:...roles)", { roles: [Role.TECNICO, Role.ADMIN] })
        .select("u.id", "id")
        .addSelect("u.name", "name")
        .addSelect("COUNT(t.id)", "openCount")
        .groupBy("u.id")
        .addGroupBy("u.name")
        .orderBy("openCount", "DESC")
        .getRawMany(),

      // Average resolution time (days) for tickets resolved in period
      ticketRepo
        .createQueryBuilder("t")
        .select(
          "AVG(TIMESTAMPDIFF(MINUTE, t.createdAt, t.resolvedAt)) / 60",
          "avgHours"
        )
        .where("t.status = :status", { status: TicketStatus.RESOLVIDO })
        .andWhere("t.resolvedAt >= :since", { since })
        .andWhere("t.resolvedAt IS NOT NULL")
        .getRawOne(),

      // Average rating in period
      historyRepo
        .createQueryBuilder("h")
        .select("AVG(CAST(h.toValue AS DECIMAL(3,1)))", "avg")
        .addSelect("COUNT(h.id)", "count")
        .where("h.action = :action", { action: HistoryAction.AVALIACAO })
        .andWhere("h.createdAt >= :since", { since })
        .getRawOne(),

      // Daily ticket creation (last periodDays)
      ticketRepo
        .createQueryBuilder("t")
        .select("DATE(t.createdAt)", "day")
        .addSelect("COUNT(t.id)", "count")
        .where("t.createdAt >= :since", { since })
        .groupBy("DATE(t.createdAt)")
        .orderBy("day", "ASC")
        .getRawMany(),
    ]);

    const slaCompliancePct =
      slaOkCount + slaViolatedCount > 0
        ? Math.round((slaOkCount / (slaOkCount + slaViolatedCount)) * 100)
        : 100;

    const resolutionRatePct =
      totalInPeriod > 0 ? Math.round((resolvedInPeriod / totalInPeriod) * 100) : 0;

    return NextResponse.json({
      period: periodDays,
      summary: {
        totalInPeriod,
        resolvedInPeriod,
        openCount,
        slaViolatedCount,
        slaOkCount,
        slaCompliancePct,
        resolutionRatePct,
        avgResolutionHours: avgResolutionRow?.avgHours ? Number(Number(avgResolutionRow.avgHours).toFixed(1)) : null,
        avgRating: ratingRow?.avg ? Number(Number(ratingRow.avg).toFixed(1)) : null,
        ratingCount: ratingRow?.count ? Number(ratingRow.count) : 0,
      },
      categoryBreakdown: categoryRows.map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName ?? "Sem categoria",
        total: Number(r.total),
        resolved: Number(r.resolved),
      })),
      techWorkload: techRows.map((r) => ({
        id: r.id,
        name: r.name,
        openCount: Number(r.openCount),
      })),
      daily: dailyRows.map((r) => ({
        day: r.day,
        count: Number(r.count),
      })),
    });
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Não foi possível gerar o relatório." }, { status: 500 });
  }
}
