import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { Ticket } from "@/entities/Ticket";
import { Category } from "@/entities/Category";
import { HistoryAction, Role, TicketStatus } from "@/types";
import { StatCard } from "@/components/stat-card";
import { BarChart3, Gauge, ShieldCheck, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TicketHistory } from "@/entities/TicketHistory";

export async function AdminStatsContainer() {
  await initializeDatabase();

  const ticketRepository = getRepository(Ticket);
  const userRepository = getRepository(User);
  const categoryRepository = getRepository(Category);
  const historyRepository = getRepository(TicketHistory);
  const now = new Date();

  // All dashboard metrics run concurrently. The grouped queries replace one count per category/technician.
  const [totalTickets, totalUsers, slaOk, slaViolado, categoryRows, technicianRows, rating] = await Promise.all([
    ticketRepository.count(),
    userRepository.count(),
    ticketRepository.createQueryBuilder("ticket").where("ticket.slaDueAt >= :now", { now }).getCount(),
    ticketRepository.createQueryBuilder("ticket").where("ticket.slaDueAt < :now", { now }).andWhere("ticket.status = :status", { status: TicketStatus.ABERTO }).getCount(),
    categoryRepository.createQueryBuilder("category").leftJoin("category.tickets", "ticket").select("category.id", "id").addSelect("category.name", "name").addSelect("COUNT(ticket.id)", "ticketCount").groupBy("category.id").addGroupBy("category.name").orderBy("category.name", "ASC").getRawMany(),
    userRepository.createQueryBuilder("user").leftJoin("user.ticketsAtendidos", "ticket").where("user.role = :role", { role: Role.TECNICO }).select("user.id", "id").addSelect("user.name", "name").addSelect("COUNT(ticket.id)", "assignedTickets").groupBy("user.id").addGroupBy("user.name").orderBy("user.name", "ASC").getRawMany(),
    historyRepository.createQueryBuilder("history").select("AVG(CAST(history.toValue AS DECIMAL(3,1)))", "media").where("history.action = :action", { action: HistoryAction.AVALIACAO }).getRawOne(),
  ]);

  const categoriesWithCount = categoryRows.map((row) => ({ id: row.id, name: row.name, ticketCount: Number(row.ticketCount) }));
  const techniciansWithCount = technicianRows.map((row) => ({ id: row.id, name: row.name, assignedTickets: Number(row.assignedTickets) }));
  const ratingValue = rating?.media ? Number(rating.media) : 0;

  return (
    <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Chamados" value={totalTickets} icon={BarChart3} />
        <StatCard label="Usuários Ativos" value={totalUsers} icon={Users} tone="text-sky-400" />
        <StatCard label="SLA no Prazo" value={slaOk} icon={ShieldCheck} tone="text-emerald-400" />
        <StatCard label="SLA Violado" value={slaViolado} icon={Gauge} tone="text-red-400" />
        <StatCard label="Rating Médio" value={ratingValue.toFixed(1)} icon={Star} tone="text-amber-400" />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="glass-card border-none shadow-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-xl font-bold"><BarChart3 className="h-5 w-5 text-primary" />Performance por Categoria</CardTitle></CardHeader><CardContent><Table><THead><TR className="border-white/5"><TH className="text-[10px] font-black uppercase tracking-widest">Categoria</TH><TH className="text-right text-[10px] font-black uppercase tracking-widest">Volume</TH></TR></THead><TBody>{categoriesWithCount.map((item) => <TR key={item.id} className="group border-white/5 hover:bg-white/5"><TD className="text-sm font-bold">{item.name}</TD><TD className="text-right"><span className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-muted/50 font-bold transition-colors group-hover:bg-primary/20 group-hover:text-primary">{item.ticketCount}</span></TD></TR>)}</TBody></Table></CardContent></Card>
        <Card className="glass-card border-none shadow-2xl"><CardHeader><CardTitle className="flex items-center gap-2 text-xl font-bold"><Users className="h-5 w-5 text-sky-400" />Carga de Trabalho (Técnicos)</CardTitle></CardHeader><CardContent><Table><THead><TR className="border-white/5"><TH className="text-[10px] font-black uppercase tracking-widest">Técnico</TH><TH className="text-right text-[10px] font-black uppercase tracking-widest">Fila</TH></TR></THead><TBody>{techniciansWithCount.map((item) => <TR key={item.id} className="group border-white/5 hover:bg-white/5"><TD className="text-sm font-bold"><div className="flex items-center gap-2"><div className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/10 text-[10px] font-black text-sky-400">{item.name.charAt(0)}</div>{item.name}</div></TD><TD className="text-right"><span className="inline-flex h-8 w-12 items-center justify-center rounded-lg bg-muted/50 font-bold transition-colors group-hover:bg-sky-500/20 group-hover:text-sky-400">{item.assignedTickets}</span></TD></TR>)}</TBody></Table></CardContent></Card>
      </div>
    </>
  );
}
