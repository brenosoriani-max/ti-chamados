import { Activity, AlertTriangle, Clock3, Monitor } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { KanbanBoard } from "@/components/kanban-board";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/cliente");

  const [tickets, pendentes, criticos, onlineMachines, activeSessions, recentRemoteSessions, techList] = await Promise.all([
    prisma.ticket.findMany({ 
      where: { isArchived: false },
      include: { customer: true, assignee: true, category: true, equipment: true }, 
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }] 
    }),
    prisma.ticket.count({ where: { isArchived: false, status: { in: ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.ticket.count({ where: { isArchived: false, priority: "CRITICA", status: { notIn: ["RESOLVIDO", "CANCELADO"] } } }),
    prisma.equipment.count({ where: { isOnline: true } }),
    prisma.remoteSession.count({ where: { isActive: true } }),
    prisma.remoteSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: { equipment: true, requestedBy: true, ticket: true }
    }),
    prisma.user.findMany({ where: { role: { in: ["TECNICO", "ADMIN"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fila de Atendimento</h1>
            <p className="text-sm text-muted-foreground">Monitoramento em tempo real de chamados e equipamentos.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 rounded-lg font-bold text-[10px] bg-background/50">
              {pendentes} PENDENTES
            </Badge>
            <Badge variant="danger" className="h-8 rounded-lg font-bold text-[10px]">
              {criticos} CRÍTICOS
            </Badge>
          </div>
        </header>

        <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Pendente" value={pendentes} icon={Clock3} tone="text-amber-500" />
          <StatCard label="Incidentes" value={criticos} icon={AlertTriangle} tone="text-red-500" />
          <StatCard label="Dispositivos" value={onlineMachines} icon={Monitor} tone="text-emerald-500" />
          <StatCard label="Atendimentos" value={activeSessions} icon={Activity} tone="text-sky-500" />
        </section>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Quadro de Status</h2>
          </div>
          
          <KanbanBoard initialTickets={tickets} techList={techList} />
        </div>

        <div className="grid gap-8 lg:grid-cols-1 mt-12 border-t border-border/20 pt-10">
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Monitor className="h-5 w-5 text-emerald-500" />
              Sessões Ativas
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {recentRemoteSessions.map((session) => (
                <Card key={session.id} className="border border-border/20 shadow-sm bg-card/40">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", session.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate">{session.equipment?.machineName ?? "Máquina"}</p>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase">Ticket #{session.ticket?.number ?? "-"}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
