import { Activity, AlertTriangle, Clock3, Monitor, Wifi, Ticket, LifeBuoy } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { TicketAssignSelect } from "@/components/ticket-assign-select";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatTicketStatus, hoursUntil } from "@/lib/utils";
import { assignTicketAction } from "@/app/actions";

const columns = ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO"];

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/cliente");
  const [tickets, pendentes, criticos, vencidos, tecnicos, onlineMachines, activeSessions, recentRemoteSessions, techList] = await Promise.all([
    prisma.ticket.findMany({ include: { customer: true, assignee: true, category: true }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }] }),
    prisma.ticket.count({ where: { status: { in: ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.ticket.count({ where: { priority: "CRITICA", status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.ticket.count({ where: { slaDueAt: { lt: new Date() }, status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.user.count({ where: { role: "TECNICO", isActive: true } }),
    prisma.equipment.count({ where: { isOnline: true } }),
    prisma.remoteSession.count({ where: { isActive: true } }),
    prisma.remoteSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { equipment: true, requestedBy: true, ticket: true }
    }),
    prisma.user.findMany({ where: { role: "TECNICO" }, select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Live Dashboard
            </div>
            <h1 className="text-4xl font-black tracking-tight">Fila de Suporte</h1>
            <p className="text-muted-foreground font-medium">Controle total sobre sua operação de TI em tempo real.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-card/40 backdrop-blur font-bold border-white/5">
              SLA Médio: 1.4h
            </Badge>
            <Badge variant="outline" className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold border-primary/20">
              {tecnicos} Técnicos Online
            </Badge>
          </div>
        </header>

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Chamados Pendentes" value={pendentes} icon={Clock3} tone="text-amber-400" />
          <StatCard label="Incidentes Críticos" value={criticos} icon={AlertTriangle} tone="text-red-400" />
          <StatCard label="Equipamentos Online" value={onlineMachines} icon={Monitor} tone="text-emerald-400" />
          <StatCard label="Sessões Remotas" value={activeSessions} icon={Wifi} tone="text-sky-400" />
        </section>

        <div className="grid gap-6 lg:grid-cols-1">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Ticket className="h-6 w-6 text-primary" />
                Quadro de Atendimento
              </h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground">Filtros</Button>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-muted-foreground hover:text-foreground">Atualizar</Button>
              </div>
            </div>
            
            <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide min-h-[700px]">
              {columns.map((column) => {
                const columnTickets = tickets.filter((t) => t.status === column);
                return (
                  <div key={column} className="flex flex-col gap-4 min-w-[340px] flex-1 bg-white/[0.02] rounded-[2.5rem] p-4 border border-white/5 shadow-2xl backdrop-blur-3xl">
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{formatTicketStatus(column)}</h3>
                      <span className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary text-white text-[10px] font-black shadow-lg shadow-primary/20">
                        {columnTickets.length}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {columnTickets.length > 0 ? (
                        columnTickets.map((ticket) => {
                          const hours = hoursUntil(ticket.slaDueAt);
                          const isOverdue = hours < 0;
                          return (
                            <Card key={ticket.id} className="glass-card group hover:scale-[1.02] hover:bg-white/[0.04] hover:border-primary/40 transition-all duration-300 cursor-pointer overflow-hidden border-white/5 shadow-xl">
                              <div className={`h-1.5 w-full ${isOverdue ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]' : hours < 2 ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'} transition-all group-hover:h-2`} />
                              <CardHeader className="p-5 pb-3">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                  <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg tracking-tighter">#{ticket.number}</span>
                                  <PriorityBadge priority={ticket.priority} />
                                </div>
                                <CardTitle className="text-base font-bold leading-tight tracking-tight group-hover:text-primary transition-colors line-clamp-2">{ticket.title}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-5 pt-0 space-y-5">
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 shadow-inner transition-colors group-hover:bg-white/10">
                                  <div className="h-10 w-10 rounded-xl premium-gradient flex items-center justify-center text-xs font-black text-white shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
                                    {ticket.customer.name.charAt(0)}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold truncate tracking-tight">{ticket.customer.name}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">{ticket.category.name}</span>
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-black shadow-sm" title={ticket.assignee?.name ?? "Pendente"}>
                                      {ticket.assignee?.name?.charAt(0) ?? "?"}
                                    </div>
                                    <span className="text-xs font-bold text-muted-foreground/80">{ticket.assignee?.name?.split(' ')[0] ?? "Pendente"}</span>
                                  </div>
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${isOverdue ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'} text-[10px] font-black shadow-inner`}>
                                    <Clock3 className="h-3.5 w-3.5" />
                                    {isOverdue ? "VENCIDO" : `${hours}H`}
                                  </div>
                                </div>

                                {session.role === "ADMIN" && (
                                  <div className="pt-3">
                                    <TicketAssignSelect 
                                      ticketId={ticket.id} 
                                      assigneeId={ticket.assigneeId} 
                                      techList={techList} 
                                    />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-[2rem] opacity-20">
                          <Ticket className="h-8 w-8" />
                          <p className="mt-2 text-[10px] font-black uppercase tracking-widest">Coluna Vazia</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-6">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Activity className="h-6 w-6 text-emerald-500" />
              Monitoramento Remoto
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {recentRemoteSessions.length > 0 ? (
                recentRemoteSessions.map((session) => (
                  <Card key={session.id} className="glass-card group hover:border-emerald-500/30 transition-all border-none">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${session.isActive ? 'bg-emerald-500/20 text-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                        <Monitor className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{session.equipment?.machineName ?? session.userName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${session.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
                          <span className="text-[10px] font-black text-muted-foreground/60 uppercase">Ticket #{session.ticket?.number ?? "-"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant="glass" className="text-[8px] font-black px-2 py-0.5">{session.connectionType}</Badge>
                        <Badge variant="glass" className="text-[8px] font-black px-2 py-0.5">{session.mode}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center glass-card rounded-3xl border-none">
                  <Monitor className="h-10 w-10 text-muted-foreground/20" />
                  <p className="mt-4 text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">Nenhuma sessão remota ativa</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <Card className="premium-gradient text-white border-none shadow-2xl shadow-primary/30 rounded-3xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <LifeBuoy className="h-24 w-24" />
              </div>
              <CardContent className="p-8 space-y-6 relative z-10">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tight leading-none">Acesso Rápido</h3>
                  <p className="text-sm text-white/70 font-medium">Inicie um suporte remoto agora mesmo.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button className="w-full h-12 rounded-2xl bg-white text-primary text-xs font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                    NOVA SESSÃO REMOTA
                  </Button>
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-white/20 hover:bg-white/10 text-white text-xs font-black transition-all">
                    VER LOGS DE ACESSO
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
