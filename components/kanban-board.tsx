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
import { User, Archive, MoreHorizontal, Clock, Hash } from "lucide-react";
import { PriorityBadge } from "@/components/status-badge";
import { RemoteAccessControl } from "@/components/remote-access-control";
import { TicketAssignSelect } from "@/components/ticket-assign-select";
import { formatTicketStatus, hoursUntil, cn } from "@/lib/utils";
import { updateTicketStatusAction, archiveTicketAction } from "@/app/actions";
import { toast } from "sonner";

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
             <RemoteAccessControl 
               hostname={ticket.equipment?.hostname ?? null} 
               ipAddress={ticket.equipment?.ipAddress ?? null} 
               ticketId={ticket.id}
               equipmentId={ticket.equipment?.id || ticket.equipmentId}
             />
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

        <h4 className="text-[13px] font-bold leading-snug text-foreground/90 group-hover:text-primary transition-colors pr-2">
          {ticket.title}
        </h4>

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
      <div className="flex items-center justify-between px-2 mb-4 shrink-0">
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

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-hide">
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket: any) => (
            <SortableTicket key={ticket.id} ticket={ticket} techList={techList} onArchive={onArchive} />
          ))}
        </SortableContext>
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
          toast.success(`Status atualizado para ${formatTicketStatus(newStatus)}`);
        } catch (error) {
          toast.error("Erro ao atualizar status");
        }
      });
    }
  }, [tickets, activeTicket]);

  const handleArchive = useCallback((ticketId: string) => {
    startTransition(async () => {
      try {
        await archiveTicketAction(ticketId, true);
        setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
        toast.info("Chamado arquivado com sucesso");
      } catch (error) {
        toast.error("Erro ao arquivar chamado");
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
      <div className="flex gap-6 overflow-x-auto pb-12 scrollbar-hide min-h-[700px] items-start">
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
