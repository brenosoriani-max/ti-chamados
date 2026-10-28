"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Archive, ChevronDown, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { archiveTicketAction } from "@/app/actions";
import { toast } from "sonner";

interface ArchivedTicketsProps {
  initialArchivedTickets: any[];
}

export function ArchivedTickets({ initialArchivedTickets }: ArchivedTicketsProps) {
  const [tickets, setTickets] = useState(initialArchivedTickets);
  const [showArchived, setShowArchived] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRestore(ticketId: string) {
    startTransition(async () => {
      try {
        await archiveTicketAction(ticketId, false);
        setTickets((current) => current.filter((ticket) => ticket.id !== ticketId));
        toast.success("Chamado restaurado para a fila.");
      } catch {
        toast.error("Não foi possível restaurar o chamado.");
      }
    });
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold">Arquivo de chamados</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Itens encerrados ou retirados da fila de trabalho.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowArchived((value) => !value)}>
          {showArchived ? "Ocultar arquivo" : `Ver arquivo (${tickets.length})`}
          <ChevronDown className={`h-4 w-4 transition-transform ${showArchived ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {showArchived && (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border/60 bg-card">
          {tickets.length > 0 ? (
            <div className="divide-y divide-border/50">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4">
                  <span className="w-fit rounded-md bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">#{ticket.number}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/tickets/${ticket.id}`} className="block truncate text-sm font-semibold hover:text-primary hover:underline">{ticket.title}</Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" />{ticket.customer?.name ?? "Cliente"}</span>
                      <span>Atualizado em {new Date(ticket.updatedAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <StatusBadge status={ticket.status} />
                    <Button variant="ghost" size="sm" disabled={isPending} className="h-8 rounded-lg text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={() => handleRestore(ticket.id)}>
                      <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Não há chamados arquivados.</p>
          )}
        </div>
      )}
    </div>
  );
}
