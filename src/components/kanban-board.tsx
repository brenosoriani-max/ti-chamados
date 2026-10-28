"use client";

import { useEffect, useState, useTransition, useMemo, useCallback, memo } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Clock, ExternalLink, Hash, Inbox } from "lucide-react";
import Link from "next/link";
import { PriorityBadge } from "@/components/status-badge";
import { TicketAssignSelect } from "@/components/ticket-assign-select";
import { formatTicketStatus, hoursUntil, cn } from "@/lib/utils";
import { updateTicketStatusAction, archiveTicketAction } from "@/app/actions";
import { toast } from "sonner";
import { messages } from "@/lib/messages";

interface KanbanBoardProps {
  initialTickets: any[];
  techList: any[];
}

const columns = ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO"];

const TicketCard = memo(({ ticket, techList, isOverlay, onArchive }: any) => {
  const hours = hoursUntil(ticket.slaDueAt);
  const isOverdue = hours < 0;

  return (
    <div className={cn(
      "kanban-card group relative",
      isOverlay ? "opacity-100 rotate-1 shadow-2xl ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-[1.01]"
    )}>
      {/* SLA Indicator */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
        isOverdue ? "bg-red-600" : hours < 2 ? "bg-amber-500" : "bg-emerald-500"
      )} />

      <div className="space-y-3 pl-1">
        <div className="flex items-center justify-between gap-2" onPointerDown={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 min-w-0">
             <span className="text-[9px] font-black text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/20 flex items-center gap-1 shrink-0">
               <Hash className="h-2 w-2" />
               {ticket.number}
             </span>
             <PriorityBadge priority={ticket.priority} />
          </div>
          
          <div className="flex items-center gap-1 shrink-0" onPointerDown={e => e.stopPropagation()}>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
               onClick={() => onArchive?.(ticket.id)}
             >
               <Archive className="h-3 w-3" />
             </Button>
          </div>
        </div>

        <Link
          href={`/tickets/${ticket.id}`}
          onPointerDown={(event) => event.stopPropagation()}
          className="flex items-start justify-between gap-2 text-[13px] font-bold leading-snug text-foreground/90 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span>{ticket.title}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>

        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold min-w-0">
              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[8px] font-black uppercase">
                {ticket.customer.name.charAt(0)}
              </div>
              <span className="truncate">{ticket.customer.name}</span>
            </div>
            
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black",
              isOverdue ? "bg-red-500/10 text-red-600" : "bg-muted/50 text-muted-foreground"
            )}>
              <Clock className="h-2.5 w-2.5" />
              {isOverdue ? "VENCIDO" : `${hours}H`}
            </div>
          </div>

          <div className="pt-1" onPointerDown={e => e.stopPropagation()}>
            <TicketAssignSelect 
              ticketId={ticket.id} 
              assigneeId={ticket.assigneeId} 
              techList={techList} 
            />
          </div>
        </div>
      </div>
    </div>
  );
});

TicketCard.displayName = "TicketCard";

const SortableTicket = memo(({ ticket, techList, onArchive }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: ticket.id,
    data: {
      type: "Ticket",
      ticket,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        className="opacity-20 border-2 border-dashed border-primary/40 rounded-xl min-h-[140px] bg-primary/5 shrink-0"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} techList={techList} onArchive={onArchive} />
    </div>
  );
});

SortableTicket.displayName = "SortableTicket";

const KanbanColumn = memo(({ id, title, tickets, techList, onArchive }: any) => {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
    },
  });

  const ticketIds = useMemo(() => tickets.map((t: any) => t.id), [tickets]);

  return (
    <div ref={setNodeRef} className="kanban-column group/col">
      <div className="mb-4 flex items-center justify-between px-1 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "h-2 w-2 rounded-full",
            id === "ABERTO" ? "bg-blue-500" : 
            id === "EM_ATENDIMENTO" ? "bg-emerald-500" : 
            id === "RESOLVIDO" ? "bg-gray-400" : "bg-amber-500"
          )} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80 truncate">
            {title}
          </h3>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/50 border border-border/50 text-muted-foreground group-hover/col:border-primary/30 group-hover/col:text-primary transition-all">
          {tickets.length}
        </span>
      </div>

      <div className="flex min-h-[190px] flex-1 flex-col gap-3 overflow-y-auto pr-1 scrollbar-hide">
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket: any) => (
            <SortableTicket key={ticket.id} ticket={ticket} techList={techList} onArchive={onArchive} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 px-4 text-center">
            <Inbox className="mb-2 h-4 w-4 text-muted-foreground/70" />
            <p className="text-[11px] font-medium text-muted-foreground">Nenhum chamado nesta etapa</p>
          </div>
        )}
      </div>
    </div>
  );
});

KanbanColumn.displayName = "KanbanColumn";

export function KanbanBoard({ initialTickets, techList }: KanbanBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setTickets(initialTickets);
  }, [initialTickets]);

  const visibleTickets = useMemo(() => tickets.filter((ticket) => !ticket.isArchived), [tickets]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const ticket = tickets.find((t) => t.id === active.id);
    setActiveTicket(ticket);
    // Haptic feedback if available
    if (window.navigator?.vibrate) window.navigator.vibrate(5);
  }, [tickets]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATicket = active.data.current?.type === "Ticket";
    const isOverATicket = over.data.current?.type === "Ticket";

    if (!isActiveATicket) return;

    if (isActiveATicket && isOverATicket) {
      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          const newTickets = [...prev];
          newTickets[activeIndex] = { ...newTickets[activeIndex], status: newTickets[overIndex].status };
          return arrayMove(newTickets, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    if (isActiveATicket && isOverAColumn) {
      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const newTickets = [...prev];
        newTickets[activeIndex] = { ...newTickets[activeIndex], status: overId as string };
        return arrayMove(newTickets, activeIndex, activeIndex);
      });
    }
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const overId = over.id;
    const type = over.data.current?.type;

    const targetTicket = tickets.find(t => t.id === overId);
    const newStatus = type === "Column" ? (overId as string) : targetTicket?.status;

    if (newStatus && activeTicket?.status !== newStatus) {
      startTransition(async () => {
        try {
          await updateTicketStatusAction(ticketId, newStatus);
          toast.success(messages.tickets.statusUpdated(formatTicketStatus(newStatus)));
        } catch (error) {
          toast.error(messages.tickets.statusUpdateError);
        }
      });
    }
  }, [tickets, activeTicket]);

  const handleArchive = useCallback((ticketId: string) => {
    startTransition(async () => {
      try {
        await archiveTicketAction(ticketId, true);
        setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
        toast.info(messages.tickets.archiveSuccess);
      } catch (error) {
        toast.error(messages.tickets.archiveError);
      }
    });
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-[530px] items-start gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {columns.map((col) => (
          <KanbanColumn 
            key={col} 
            id={col} 
            title={formatTicketStatus(col)} 
            tickets={visibleTickets.filter((t) => t.status === col)}
            techList={techList}
            onArchive={handleArchive}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTicket ? (
          <div className="w-[300px]">
            <TicketCard ticket={activeTicket} techList={techList} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
