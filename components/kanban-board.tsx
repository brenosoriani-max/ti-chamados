"use client";

import { useState, useOptimistic, useTransition } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Clock3, Archive } from "lucide-react";
import { PriorityBadge } from "@/components/status-badge";
import { RemoteAccessControl } from "@/components/remote-access-control";
import { TicketAssignSelect } from "@/components/ticket-assign-select";
import { formatTicketStatus, hoursUntil, cn } from "@/lib/utils";
import { updateTicketStatusAction, archiveTicketAction } from "@/app/actions";

interface KanbanBoardProps {
  initialTickets: any[];
  techList: any[];
}

const columns = ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO"];

export function KanbanBoard({ initialTickets, techList }: KanbanBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const ticket = tickets.find((t) => t.id === active.id);
    setActiveTicket(ticket);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATicket = active.data.current?.type === "Ticket";
    const isOverATicket = over.data.current?.type === "Ticket";

    if (!isActiveATicket) return;

    // Imagem se estamos arrastando um ticket sobre outro ticket
    if (isActiveATicket && isOverATicket) {
      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          prev[activeIndex].status = prev[overIndex].status;
          return arrayMove(prev, activeIndex, overIndex);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    const isOverAColumn = over.data.current?.type === "Column";

    // Imagem se estamos arrastando um ticket sobre uma coluna
    if (isActiveATicket && isOverAColumn) {
      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        prev[activeIndex].status = overId as string;
        return arrayMove(prev, activeIndex, activeIndex);
      });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const ticketId = active.id as string;
    const newStatus = over.data.current?.type === "Column" 
      ? (over.id as string) 
      : tickets.find(t => t.id === over.id)?.status;

    if (newStatus) {
      startTransition(async () => {
        await updateTicketStatusAction(ticketId, newStatus);
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide min-h-[600px]">
        {columns.map((col) => (
          <KanbanColumn 
            key={col} 
            id={col} 
            title={formatTicketStatus(col)} 
            tickets={tickets.filter((t) => t.status === col)}
            techList={techList}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: "0.5",
            },
          },
        }),
      }}>
        {activeTicket ? (
          <div className="w-[320px] rotate-3 scale-105 transition-transform">
            <TicketCard ticket={activeTicket} techList={techList} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({ id, title, tickets, techList }: any) {
  const { setNodeRef } = useSortable({
    id: id,
    data: {
      type: "Column",
    },
  });

  const ticketIds = tickets.map((t: any) => t.id);

  return (
    <div ref={setNodeRef} className="flex flex-col gap-4 min-w-[320px] w-[320px] bg-muted/20 rounded-2xl p-4 border border-border/40 transition-colors">
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</h3>
        <Badge variant="secondary" className="h-5 min-w-[20px] flex justify-center text-[9px] font-bold bg-background/50">
          {tickets.length}
        </Badge>
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-[100px]">
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket: any) => (
            <SortableTicket key={ticket.id} ticket={ticket} techList={techList} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableTicket({ ticket, techList }: any) {
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
        className="opacity-30 border-2 border-primary/20 rounded-2xl h-[160px] bg-muted/10 shrink-0"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} techList={techList} />
    </div>
  );
}

function TicketCard({ ticket, techList, isOverlay }: any) {
  const hours = hoursUntil(ticket.slaDueAt);
  const isOverdue = hours < 0;

  return (
    <Card className={cn(
      "border border-transparent shadow-sm bg-card transition-all cursor-grab active:cursor-grabbing group overflow-hidden rounded-2xl",
      isOverlay ? "shadow-2xl border-primary/20" : "hover:border-primary/20 hover:shadow-md"
    )}>
      <div className={`h-1 w-full ${isOverdue ? 'bg-red-500' : hours < 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3" onPointerDown={e => e.stopPropagation()}>
          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">#{ticket.number}</span>
          <div className="flex items-center gap-1.5" onPointerDown={e => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
              onClick={() => archiveTicketAction(ticket.id, true)}
            >
              <Archive className="h-3.5 w-3.5" />
            </Button>
            <RemoteAccessControl 
              hostname={ticket.equipment?.hostname ?? null} 
              ipAddress={ticket.equipment?.ipAddress ?? null} 
            />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <CardTitle className="text-xs font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">{ticket.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium min-w-0">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">{ticket.customer.name}</span>
          </div>
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/50",
            isOverdue ? "text-red-500" : "text-muted-foreground"
          )}>
            {isOverdue ? "EXPIRADO" : `${hours}h`}
          </span>
        </div>

        <div className="pt-3 border-t border-border/20" onPointerDown={e => e.stopPropagation()}>
          <TicketAssignSelect 
            ticketId={ticket.id} 
            assigneeId={ticket.assigneeId} 
            techList={techList} 
          />
        </div>
      </CardContent>
    </Card>
  );
}
