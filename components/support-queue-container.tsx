import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/stat-card";
import { Clock3, AlertTriangle, Monitor, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import KanbanBoard as it uses dnd-kit which is heavy
const KanbanBoard = dynamic(() => import("@/components/kanban-board").then(m => m.KanbanBoard), {
  ssr: false,
  loading: () => <Skeleton className="h-[600px] w-full rounded-2xl" />
});

const ArchivedTickets = dynamic(() => import("@/components/archived-tickets").then(m => m.ArchivedTickets), {
  ssr: false,
  loading: () => <Skeleton className="h-[400px] w-full rounded-2xl" />
});

export async function SupportQueueContainer() {
  const [tickets, archivedTickets, pendentes, criticos, onlineMachines, activeSessions, recentRemoteSessions, techList] = await Promise.all([
    prisma.ticket.findMany({ 
      where: { isArchived: false },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        slaDueAt: true,
        assigneeId: true,
        isArchived: true,
        updatedAt: true,
        customer: { select: { name: true } },
        equipment: { select: { id: true, hostname: true, ipAddress: true, machineName: true } },
      }, 
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }] 
    }),
    prisma.ticket.findMany({
      where: { isArchived: true },
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        priority: true,
        slaDueAt: true,
        assigneeId: true,
        isArchived: true,
        updatedAt: true,
        customer: { select: { name: true } },
        equipment: { select: { id: true, hostname: true, ipAddress: true, machineName: true } },
      },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.ticket.count({ where: { isArchived: false, status: { in: ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.ticket.count({ where: { isArchived: false, priority: "CRITICA", status: { notIn: ["RESOLVIDO", "CANCELADO"] } } }),
    prisma.equipment.count({ where: { isOnline: true } }),
    prisma.remoteSession.count({ where: { isActive: true } }),
    prisma.remoteSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 4,
      select: {
        id: true,
        isActive: true,
        updatedAt: true,
        equipment: { select: { machineName: true } },
        ticket: { select: { number: true } },
      }
    }),
    prisma.user.findMany({ where: { role: { in: ["TECNICO", "ADMIN"] } }, select: { id: true, name: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 -mt-16 justify-end relative z-10">
        <Badge variant="outline" className="h-8 rounded-lg font-bold text-[10px] bg-background/50">
          {pendentes} PENDENTES
        </Badge>
        <Badge variant="secondary" className="h-8 rounded-lg font-bold text-[10px] bg-red-500/10 text-red-500 border-red-500/20">
          {criticos} CRÍTICOS
        </Badge>
      </div>

      <section className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pendente" value={pendentes} icon={Clock3} tone="text-amber-500" />
        <StatCard label="Incidentes" value={criticos} icon={AlertTriangle} tone="text-red-500" />
        <StatCard label="Dispositivos" value={onlineMachines} icon={Monitor} tone="text-emerald-500" />
        <StatCard label="Atendimentos" value={activeSessions} icon={Activity} tone="text-sky-500" />
      </section>

      <div className="space-y-6">
        <h2 className="text-xl font-bold">Quadro de Status</h2>
        <KanbanBoard initialTickets={tickets} techList={techList} />
      </div>

      <div className="mt-12 border-t border-border/20 pt-10">
        <ArchivedTickets initialArchivedTickets={archivedTickets} />
      </div>

      <div className="mt-12 border-t border-border/20 pt-10">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
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
  );
}
