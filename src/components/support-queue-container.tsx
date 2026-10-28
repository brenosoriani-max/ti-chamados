import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { StatCard } from "@/components/stat-card";
import { Clock3, AlertTriangle, Monitor, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { KanbanBoard } from "@/components/kanban-board";
import { ArchivedTickets } from "@/components/archived-tickets";
import { Ticket } from "@/entities/Ticket";
import { Terminal } from "@/entities/Terminal";
import { User } from "@/entities/User";
import { Role, TicketStatus, Priority, TerminalStatus } from "@/types";
import { In, Not } from "typeorm";
import { mapTicketListItem } from "@/lib/ticket-queries";

export async function SupportQueueContainer() {
  await initializeDatabase();

  const ticketRepository = getRepository(Ticket);
  const terminalRepository = getRepository(Terminal);
  const userRepository = getRepository(User);

  const [activeTickets, archivedTickets, pendingCount, criticalCount, onlineMachines, techList] = await Promise.all([
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
    userRepository.find({
      where: { role: In([Role.TECNICO, Role.ADMIN]) },
      select: ["id", "name"],
      order: { name: "ASC" },
    }),
  ]);

  const tickets = activeTickets.map(mapTicketListItem);
  const archived = archivedTickets.map(mapTicketListItem);
  const plainTechList = techList.map((technician) => ({ id: technician.id, name: technician.name }));
  const resolvedCount = activeTickets.filter((ticket) => ticket.status === TicketStatus.RESOLVIDO).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Visão operacional</p>
          <p className="mt-1 text-sm text-muted-foreground">Organize prioridades e acompanhe cada etapa do atendimento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="h-8 rounded-lg border-border/60 bg-background px-3 text-[10px] font-bold tracking-wider text-muted-foreground">
            {pendingCount} EM ABERTO
          </Badge>
          <Badge variant="outline" className="h-8 rounded-lg border-red-500/20 bg-red-500/5 px-3 text-[10px] font-bold tracking-wider text-red-600 dark:text-red-400">
            {criticalCount} CRÍTICOS
          </Badge>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Na fila" value={pendingCount} icon={Clock3} tone="text-amber-500" />
        <StatCard label="Prioridade crítica" value={criticalCount} icon={AlertTriangle} tone="text-red-500" />
        <StatCard label="Resolvidos" value={resolvedCount} icon={CheckCircle2} tone="text-emerald-500" />
        <StatCard label="Dispositivos online" value={onlineMachines} icon={Monitor} tone="text-sky-500" />
      </section>

      <section className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Fluxo de atendimento</h2>
            <p className="mt-1 text-sm text-muted-foreground">Arraste um chamado entre as etapas para atualizar seu status.</p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">{tickets.length} chamados ativos</span>
        </div>
        <KanbanBoard initialTickets={tickets} techList={plainTechList} />
      </section>

      <section className="border-t border-border/50 pt-6">
        <ArchivedTickets initialArchivedTickets={archived} />
      </section>
    </div>
  );
}
