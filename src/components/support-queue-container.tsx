import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { StatCard } from "@/components/stat-card";
import { Clock3, AlertTriangle, Monitor, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/kanban-board";
import { ArchivedTickets } from "@/components/archived-tickets";
import { Ticket } from "@/entities/Ticket";
import { Terminal } from "@/entities/Terminal";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { User } from "@/entities/User";
import { Role, TicketStatus, Priority, SessaoRemotaStatus, TerminalStatus } from "@/types";
import { In, Not } from "typeorm";
import { mapTicketListItem } from "@/lib/ticket-queries";

export async function SupportQueueContainer() {
  await initializeDatabase();

  const ticketRepository = getRepository(Ticket);
  const terminalRepository = getRepository(Terminal);
  const sessaoRepository = getRepository(SessaoRemota);
  const userRepository = getRepository(User);

  const [activeTickets, archivedTickets, pendentes, criticos, onlineMachines, activeSessions, recentRemoteSessions, techList] =
    await Promise.all([
      ticketRepository.find({
        where: { isArchived: false },
        relations: ["cliente", "equipment"],
        order: { updatedAt: "DESC" },
      }),
      ticketRepository.find({
        where: { isArchived: true },
        relations: ["cliente", "equipment"],
        order: { updatedAt: "DESC" },
      }),
      ticketRepository.count({
        where: {
          isArchived: false,
          status: In([
            TicketStatus.ABERTO,
            TicketStatus.EM_ANALISE,
            TicketStatus.EM_ATENDIMENTO,
            TicketStatus.AGUARDANDO_CLIENTE,
          ]),
        },
      }),
      ticketRepository.count({
        where: {
          isArchived: false,
          prioridade: Priority.CRITICA,
          status: Not(In([TicketStatus.RESOLVIDO, TicketStatus.CANCELADO])),
        },
      }),
      terminalRepository.count({ where: { status: TerminalStatus.ONLINE } }),
      sessaoRepository.count({
        where: {
          status: In([
            SessaoRemotaStatus.AGUARDANDO,
            SessaoRemotaStatus.CONECTANDO,
            SessaoRemotaStatus.ATIVA,
          ]),
        },
      }),
      sessaoRepository.find({
        relations: ["terminal", "usuario"],
        order: { createdAt: "DESC" },
        take: 4,
      }),
      userRepository.find({
        where: { role: In([Role.TECNICO, Role.ADMIN]) },
        select: ["id", "name"],
        order: { name: "ASC" },
      }),
    ]);

  const tickets = activeTickets.map(mapTicketListItem);
  const archived = archivedTickets.map(mapTicketListItem);

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-3 justify-end">
        <Badge variant="outline" className="h-9 px-4 rounded-xl font-bold text-[10px] bg-background/50 border-border/40 text-muted-foreground tracking-widest">
          {pendentes} CHAMADOS PENDENTES
        </Badge>
        <Badge variant="secondary" className="h-9 px-4 rounded-xl font-bold text-[10px] bg-red-500/10 text-red-500 border-red-500/20 tracking-widest animate-pulse">
          {criticos} CRÍTICOS AGORA
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
        <ArchivedTickets initialArchivedTickets={archived} />
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
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", session.status !== "ENCERRADA" ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground')}>
                  <Activity className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate">{session.terminal?.nome ?? "Terminal"}</p>
                  <p className="text-[9px] font-medium text-muted-foreground uppercase">{session.usuario?.name ?? "Operador"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
