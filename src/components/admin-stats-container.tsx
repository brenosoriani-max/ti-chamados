import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { Ticket } from "@/entities/Ticket";
import { Category } from "@/entities/Category";
import { HistoryAction, Priority, Role, TicketStatus } from "@/types";
import { StatCard } from "@/components/stat-card";
import {
  BarChart3,
  Gauge,
  ShieldCheck,
  Star,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TicketHistory } from "@/entities/TicketHistory";
import { Not, In } from "typeorm";
import Link from "next/link";

export async function AdminStatsContainer() {
  await initializeDatabase();

  const ticketRepository = getRepository(Ticket);
  const userRepository = getRepository(User);
  const categoryRepository = getRepository(Category);
  const historyRepository = getRepository(TicketHistory);
  const now = new Date();

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  const [
    totalTickets,
    totalUsers,
    slaOk,
    slaViolado,
    openCount,
    resolvedCount,
    categoryRows,
    technicianRows,
    rating,
    avgResolutionRow,
    priorityRows,
  ] = await Promise.all([
    ticketRepository.count(),
    userRepository.count(),
    ticketRepository
      .createQueryBuilder("ticket")
      .where("ticket.slaDueAt >= :now", { now })
      .andWhere("ticket.status NOT IN (:...statuses)", {
        statuses: [TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO],
      })
      .andWhere("ticket.isArchived = :archived", { archived: false })
      .getCount(),
    ticketRepository
      .createQueryBuilder("ticket")
      .where("ticket.slaDueAt < :now", { now })
      .andWhere("ticket.status NOT IN (:...statuses)", {
        statuses: [TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO],
      })
      .andWhere("ticket.isArchived = :archived", { archived: false })
      .getCount(),
    ticketRepository.count({
      where: {
        status: Not(In([TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO])),
        isArchived: false,
      },
    }),
    ticketRepository.count({
      where: { status: TicketStatus.RESOLVIDO, isArchived: false },
    }),
    categoryRepository
      .createQueryBuilder("category")
      .leftJoin("category.tickets", "ticket")
      .select("category.id", "id")
      .addSelect("category.name", "name")
      .addSelect("COUNT(ticket.id)", "ticketCount")
      .groupBy("category.id")
      .addGroupBy("category.name")
      .orderBy("ticketCount", "DESC")
      .limit(8)
      .getRawMany(),
    userRepository
      .createQueryBuilder("user")
      .leftJoin(
        "user.ticketsAtendidos",
        "ticket",
        "ticket.isArchived = false AND ticket.status NOT IN ('RESOLVIDO','ENCERRADO','CANCELADO')"
      )
      .where("user.role IN (:...roles)", { roles: [Role.TECNICO, Role.ADMIN] })
      .select("user.id", "id")
      .addSelect("user.name", "name")
      .addSelect("COUNT(ticket.id)", "assignedTickets")
      .groupBy("user.id")
      .addGroupBy("user.name")
      .orderBy("assignedTickets", "DESC")
      .limit(8)
      .getRawMany(),
    historyRepository
      .createQueryBuilder("history")
      .select("AVG(CAST(history.toValue AS DECIMAL(3,1)))", "media")
      .where("history.action = :action", { action: HistoryAction.AVALIACAO })
      .getRawOne(),
    ticketRepository
      .createQueryBuilder("ticket")
      .select("AVG(TIMESTAMPDIFF(MINUTE, ticket.createdAt, ticket.resolvedAt)) / 60", "avgHours")
      .where("ticket.status = :status", { status: TicketStatus.RESOLVIDO })
      .andWhere("ticket.resolvedAt >= :since", { since: since30 })
      .andWhere("ticket.resolvedAt IS NOT NULL")
      .getRawOne(),
    ticketRepository
      .createQueryBuilder("ticket")
      .select("ticket.prioridade", "priority")
      .addSelect("COUNT(ticket.id)", "count")
      .where("ticket.isArchived = :archived", { archived: false })
      .groupBy("ticket.prioridade")
      .getRawMany(),
  ]);

  const categoriesWithCount = categoryRows.map((row) => ({
    id: row.id,
    name: row.name,
    ticketCount: Number(row.ticketCount),
  }));
  const techniciansWithCount = technicianRows.map((row) => ({
    id: row.id,
    name: row.name,
    assignedTickets: Number(row.assignedTickets),
  }));
  const ratingValue = rating?.media ? Number(rating.media) : 0;
  const slaCompliancePct =
    slaOk + slaViolado > 0 ? Math.round((slaOk / (slaOk + slaViolado)) * 100) : 100;
  const avgHours = avgResolutionRow?.avgHours
    ? Number(Number(avgResolutionRow.avgHours).toFixed(1))
    : null;

  const maxCatCount = Math.max(...categoriesWithCount.map((c) => c.ticketCount), 1);
  const maxTechCount = Math.max(...techniciansWithCount.map((t) => t.assignedTickets), 1);
  const priorityOrder = [Priority.CRITICA, Priority.ALTA, Priority.MEDIA, Priority.BAIXA];
  const priorityCounts = priorityOrder.map((priority) => ({
    priority,
    count: Number(priorityRows.find((row) => row.priority === priority)?.count ?? 0),
  }));
  const maxPriorityCount = Math.max(...priorityCounts.map((item) => item.count), 1);
  const priorityLabels: Record<string, string> = {
    CRITICA: "Crítica",
    ALTA: "Alta",
    MEDIA: "Média",
    BAIXA: "Baixa",
  };
  const priorityColors: Record<string, string> = {
    CRITICA: "bg-red-500",
    ALTA: "bg-amber-500",
    MEDIA: "bg-sky-500",
    BAIXA: "bg-slate-400",
  };

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Total Chamados" value={totalTickets} icon={BarChart3} />
        <StatCard label="Usuários" value={totalUsers} icon={Users} tone="text-sky-400" />
        <StatCard label="SLA em dia" value={slaOk} icon={ShieldCheck} tone="text-emerald-400" />
        <StatCard label="SLA violado" value={slaViolado} icon={Gauge} tone="text-red-400" />
        <StatCard label="Rating médio" value={ratingValue.toFixed(1)} icon={Star} tone="text-amber-400" />
        <StatCard label="Tempo médio" value={avgHours != null ? `${avgHours}h` : "—"} icon={Clock} tone="text-violet-400" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-border/60 bg-card/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Em aberto
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.06em] text-amber-500">{openCount}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Aguardando atendimento</p>
        </div>

        <div className="rounded-[24px] border border-border/60 bg-card/80 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            Resolvidos
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.06em] text-emerald-500">{resolvedCount}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Total resolvidos</p>
        </div>

        <div className="rounded-[24px] border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-[0_10px_30px_rgba(16,185,129,0.04)]">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Conformidade SLA
          </div>
          <p className="mt-3 text-2xl font-black tracking-[-0.06em] text-emerald-600">{slaCompliancePct}%</p>
          <p className="mt-1 text-[11px] text-muted-foreground">dos chamados em aberto</p>
        </div>

        <div className="rounded-[24px] border border-primary/15 bg-primary/5 p-4 shadow-[0_10px_30px_rgba(59,130,246,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Acesso rápido</p>
          <div className="mt-3 space-y-2">
            <Link href="/admin/relatorios" className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
              → Relatórios detalhados
            </Link>
            <Link href="/admin/backup" className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
              → Gerenciar backups
            </Link>
            <Link href="/admin/conhecimento" className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary">
              → Base de conhecimento
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-border/60 bg-card/80 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
        <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Chamados por prioridade
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {priorityCounts.map((item) => (
            <div key={item.priority} className="rounded-[20px] border border-border/60 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {priorityLabels[item.priority]}
                </p>
                <p className="text-xl font-black tracking-[-0.05em] text-foreground">{item.count}</p>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-1.5 rounded-full ${priorityColors[item.priority]}`}
                  style={{ width: `${Math.round((item.count / maxPriorityCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-[28px] border border-border/60 bg-card/80 shadow-[0_12px_30px_rgba(15,23,42,0.03)]">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]">
              <BarChart3 className="h-5 w-5 text-primary" />
              Performance por categoria
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Table>
              <THead>
                <TR className="border-border/60">
                  <TH className="py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Categoria
                  </TH>
                  <TH className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Volume
                  </TH>
                  <TH className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Bar
                  </TH>
                </TR>
              </THead>
              <TBody>
                {categoriesWithCount.map((item) => (
                  <TR key={item.id} className="border-border/60 hover:bg-muted/20">
                    <TD className="py-3 text-sm font-semibold text-foreground">{item.name}</TD>
                    <TD className="py-3 text-right">
                      <span className="inline-flex h-8 min-w-11 items-center justify-center rounded-xl bg-muted/70 px-2 text-sm font-bold text-foreground">
                        {item.ticketCount}
                      </span>
                    </TD>
                    <TD className="w-24 py-3 pr-0 text-right">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary/70"
                          style={{ width: `${Math.round((item.ticketCount / maxCatCount) * 100)}%` }}
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border border-border/60 bg-card/80 shadow-[0_12px_30px_rgba(15,23,42,0.03)]">
          <CardHeader className="px-5 pb-3 pt-5">
            <CardTitle className="flex items-center gap-2 text-lg font-black tracking-[-0.04em]">
              <Users className="h-5 w-5 text-sky-400" />
              Fila por técnico
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <Table>
              <THead>
                <TR className="border-border/60">
                  <TH className="py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Técnico
                  </TH>
                  <TH className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Fila
                  </TH>
                  <TH className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    Carga
                  </TH>
                </TR>
              </THead>
              <TBody>
                {techniciansWithCount.map((item) => (
                  <TR key={item.id} className="border-border/60 hover:bg-muted/20">
                    <TD className="py-3 text-sm font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-sky-500/10 text-[10px] font-black text-sky-500">
                          {item.name.charAt(0)}
                        </div>
                        {item.name}
                      </div>
                    </TD>
                    <TD className="py-3 text-right">
                      <span
                        className={`inline-flex h-8 min-w-11 items-center justify-center rounded-xl px-2 text-sm font-bold ${
                          item.assignedTickets > 5 ? "bg-red-500/10 text-red-500" : "bg-muted/70 text-foreground"
                        }`}
                      >
                        {item.assignedTickets}
                      </span>
                    </TD>
                    <TD className="w-24 py-3 pr-0 text-right">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.assignedTickets > 5 ? "bg-red-500" : "bg-sky-500/70"
                          }`}
                          style={{ width: `${Math.round((item.assignedTickets / maxTechCount) * 100)}%` }}
                        />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
