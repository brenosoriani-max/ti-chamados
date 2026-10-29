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

  // Compute the last 30 days window for resolution metric
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
      {/* Primary KPIs */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Chamados" value={totalTickets} icon={BarChart3} />
        <StatCard label="Usuários" value={totalUsers} icon={Users} tone="text-sky-400" />
        <StatCard
          label="SLA em dia"
          value={slaOk}
          icon={ShieldCheck}
          tone="text-emerald-400"
        />
        <StatCard
          label="SLA violado"
          value={slaViolado}
          icon={Gauge}
          tone="text-red-400"
        />
        <StatCard label="Rating médio" value={ratingValue.toFixed(1)} icon={Star} tone="text-amber-400" />
        <StatCard
          label="Tempo médio"
          value={avgHours != null ? `${avgHours}h` : "—"}
          icon={Clock}
          tone="text-violet-400"
        />
      </section>

      {/* Secondary KPIs */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em]">
            <AlertTriangle className="h-3 w-3" />
            Em aberto
          </div>
          <p className="text-2xl font-black text-amber-500">{openCount}</p>
          <p className="text-[10px] text-muted-foreground">aguardando atendimento</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase tracking-[0.14em]">
            <CheckCircle2 className="h-3 w-3" />
            Resolvidos
          </div>
          <p className="text-2xl font-black text-emerald-500">{resolvedCount}</p>
          <p className="text-[10px] text-muted-foreground">total resolvidos</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 col-span-1 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold uppercase tracking-[0.14em]">
            <ShieldCheck className="h-3 w-3" />
            Conformidade SLA
          </div>
          <p className="text-2xl font-black text-emerald-600">{slaCompliancePct}%</p>
          <p className="text-[10px] text-muted-foreground">dos chamados em aberto</p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 col-span-1 space-y-2">
          <p className="text-[10px] font-bold text-primary uppercase tracking-[0.14em]">Acesso rápido</p>
          <div className="space-y-1.5">
            <Link href="/admin/relatorios" className="block text-xs font-semibold text-foreground hover:text-primary transition-colors">
              → Ver relatórios detalhados
            </Link>
            <Link href="/admin/backup" className="block text-xs font-semibold text-foreground hover:text-primary transition-colors">
              → Gerenciar backups
            </Link>
            <Link href="/admin/conhecimento" className="block text-xs font-semibold text-foreground hover:text-primary transition-colors">
              → Base de conhecimento
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border/60 bg-card p-6">
        <h3 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-muted-foreground">Chamados por prioridade</h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {priorityCounts.map((item) => (
            <div key={item.priority} className="space-y-2 rounded-2xl border border-border/50 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{priorityLabels[item.priority]}</p>
                <p className="text-xl font-black">{item.count}</p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-1.5 rounded-full ${priorityColors[item.priority]}`}
                  style={{ width: `${Math.round((item.count / maxPriorityCount) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tables */}
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="glass-card border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Performance por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR className="border-white/5">
                  <TH className="text-[10px] font-black uppercase tracking-widest">Categoria</TH>
                  <TH className="text-right text-[10px] font-black uppercase tracking-widest">Volume</TH>
                  <TH className="text-right text-[10px] font-black uppercase tracking-widest pr-2">Bar</TH>
                </TR>
              </THead>
              <TBody>
                {categoriesWithCount.map((item) => (
                  <TR key={item.id} className="group border-white/5 hover:bg-white/5">
                    <TD className="text-sm font-bold">{item.name}</TD>
                    <TD className="text-right">
                      <span className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-muted/50 font-bold transition-colors group-hover:bg-primary/20 group-hover:text-primary">
                        {item.ticketCount}
                      </span>
                    </TD>
                    <TD className="text-right pr-2 w-24">
                      <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full bg-primary/60 transition-all"
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

        <Card className="glass-card border-none shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <Users className="h-5 w-5 text-sky-400" />
              Fila por Técnico (ativos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR className="border-white/5">
                  <TH className="text-[10px] font-black uppercase tracking-widest">Técnico</TH>
                  <TH className="text-right text-[10px] font-black uppercase tracking-widest">Fila</TH>
                  <TH className="text-right text-[10px] font-black uppercase tracking-widest pr-2">Carga</TH>
                </TR>
              </THead>
              <TBody>
                {techniciansWithCount.map((item) => (
                  <TR key={item.id} className="group border-white/5 hover:bg-white/5">
                    <TD className="text-sm font-bold">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-[10px] font-black text-sky-400">
                          {item.name.charAt(0)}
                        </div>
                        {item.name}
                      </div>
                    </TD>
                    <TD className="text-right">
                      <span className={`inline-flex h-8 w-12 items-center justify-center rounded-lg font-bold transition-colors ${item.assignedTickets > 5 ? "bg-red-500/10 text-red-500" : "bg-muted/50 group-hover:bg-sky-500/20 group-hover:text-sky-400"}`}>
                        {item.assignedTickets}
                      </span>
                    </TD>
                    <TD className="text-right pr-2 w-24">
                      <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${item.assignedTickets > 5 ? "bg-red-500" : "bg-sky-500/60"}`}
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
