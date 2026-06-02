"use client";

import { useState, useTransition } from "react";
import { Archive, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { archiveTicketAction } from "@/app/actions";
import { hoursUntil, cn } from "@/lib/utils";

interface ArchivedTicketsProps {
  initialArchivedTickets: any[];
}

export function ArchivedTickets({ initialArchivedTickets }: ArchivedTicketsProps) {
  const [tickets, setTickets] = useState(initialArchivedTickets);
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRestore(ticketId: string) {
    startTransition(async () => {
      await archiveTicketAction(ticketId, false);
      setTickets((prev) => prev.filter((ticket) => ticket.id !== ticketId));
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Chamados Arquivados</h2>
          <p className="text-sm text-muted-foreground">Visualize e restaure chamados que foram arquivados.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowArchived((value) => !value)}
        >
          {showArchived ? "Ocultar arquivados" : `Ver arquivados (${tickets.length})`}
        </Button>
      </div>

      {showArchived ? (
        tickets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tickets.map((ticket) => {
              const hours = hoursUntil(ticket.slaDueAt);
              const isOverdue = hours < 0;

              return (
                <Card key={ticket.id} className="border-border/40 shadow-sm bg-card">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-1 rounded">#{ticket.number}</p>
                        <CardTitle className="mt-2 text-sm font-bold leading-tight line-clamp-2">{ticket.title}</CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        className="h-9 w-9 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600"
                        onClick={() => handleRestore(ticket.id)}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2 space-y-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        {ticket.customer?.name ?? "Cliente"}
                      </span>
                      <span className={cn(
                        "rounded-full px-2 py-1 text-[10px] font-semibold",
                        isOverdue ? "bg-red-500/10 text-red-500" : "bg-muted/20 text-muted-foreground"
                      )}>
                        {isOverdue ? "EXPIRADO" : `${hours}h`}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {ticket.status}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Não há chamados arquivados no momento.</p>
        )
      ) : null}
    </div>
  );
}
