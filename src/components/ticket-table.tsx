"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Archive } from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime, hoursUntil, cn } from "@/lib/utils";
import { TicketArchiveButton } from "@/components/ticket-archive-button";
import { acceptTicketAction } from "@/app/actions";
import { toast } from "sonner";

export function TicketTable({ tickets, userRole, userId }: { tickets: any[], userRole?: string, userId?: string }) {
  const isStaff = userRole === "TECNICO" || userRole === "ADMIN";
  const [unreadTicketIds, setUnreadTicketIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) {
      setUnreadTicketIds({});
      return;
    }

    const nextUnread: Record<string, boolean> = {};

    tickets.forEach((ticket) => {
      const raw = window.localStorage.getItem(`ticket:unread:${ticket.id}:${userId}`);
      nextUnread[ticket.id] = raw === "true";
    });

    setUnreadTicketIds(nextUnread);
  }, [tickets, userId]);

  // Also fetch server-side unread state for these tickets and merge
  useEffect(() => {
    if (!userId || tickets.length === 0) return;

    const ticketIds = tickets.map((t) => t.id);

    (async () => {
      try {
        const res = await fetch(`/api/tickets/unread`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketIds }),
        });
        if (!res.ok) return;
        const data = await res.json();
        const serverUnread: Record<string, boolean> = data.unread || {};
        setUnreadTicketIds((current) => ({ ...current, ...serverUnread }));
      } catch {
        // ignore network errors
      }
    })();
  }, [tickets, userId]);

  const handleAccept = async (ticketId: string) => {
    try {
      await acceptTicketAction(ticketId);
      toast.success("Chamado aceito com sucesso.");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar o chamado.");
    }
  };

  // Header should always show Actions if user is logged in, 
  // or we can just always show it and handle per-row
  const showActionsHeader = true; 
  return (
    <div className="bg-card border border-border/40 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <THead className="bg-muted/30">
            <TR className="hover:bg-transparent border-b border-border/40">
              <TH className="py-3 px-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Número</TH>
              <TH className="py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assunto</TH>
              <TH className="py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Status</TH>
              <TH className="py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Prioridade</TH>
              <TH className="py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Vencimento</TH>
              <TH className="py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Técnico Responsável</TH>
              <TH className="py-3 pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {tickets.map((ticket) => {
              const hours = hoursUntil(ticket.slaDueAt);
              const isOverdue = hours < 0;
              const hasUnread = !!userId && unreadTicketIds[ticket.id];
              const isAssignedToCurrentUser = ticket.assigneeId === userId;

              return (
                <TR key={ticket.id} className="group border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
                  <TD className="py-4 px-6 font-bold text-xs">
                    <div className="flex flex-col gap-1">
                      <Link href={`/tickets/${ticket.id}`} className="text-primary hover:underline">
                        #{ticket.number}
                      </Link>
                      {ticket.isArchived && (
                        <span className="text-[8px] font-black bg-amber-500/10 text-amber-600 px-1 py-0.5 rounded w-fit">ARQUIVADO</span>
                      )}
                    </div>
                  </TD>
                  <TD className="py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm tracking-tight">{ticket.title}</p>
                      {hasUnread && (
                        <span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-blue-600 dark:text-blue-300">
                          Nova
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium text-muted-foreground/60">{ticket.category?.name ?? "Geral"}</span>
                      <span className="text-[10px] text-muted-foreground/30">•</span>
                      <span className="text-[10px] font-medium text-primary/60">{ticket.customer.name}</span>
                    </div>
                  </TD>
                  <TD className="py-4 text-center">
                    <div className="flex items-center justify-center">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </TD>
                  <TD className="py-4 text-center"><PriorityBadge priority={ticket.priority} /></TD>
                  <TD className="py-4 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md inline-block min-w-[100px]",
                      isOverdue ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {isOverdue ? `ATRASADO ${Math.abs(hours)}h` : `${hours}h restantes`}
                    </span>
                  </TD>
              <TD className="py-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {ticket.assigneeName ?? "Nenhum"}
                  </span>

                  {ticket.status === "RESOLVIDO" ? null : ticket.assigneeId ? (
                    <span className="text-[8px] uppercase tracking-[0.14em] text-emerald-600 font-black">
                      Em atendimento
                    </span>
                  ) : (
                    <span className="text-[8px] uppercase tracking-[0.14em] text-amber-600 font-black">
                      Pendente
                    </span>
                  )}
                </div>
              </TD>
                  <TD className="py-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      {isStaff && !ticket.assigneeId && (
                        <button
                          type="button"
                          onClick={() => handleAccept(ticket.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all"
                        >
                          <Check className="h-3 w-3" />
                          Aceitar
                        </button>
                      )}
                      {(isStaff || ticket.customerId === userId) && (
                        <TicketArchiveButton ticketId={ticket.id} isArchived={ticket.isArchived} />
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
            {tickets.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-10 text-center text-xs font-medium text-muted-foreground italic">
                  Nenhum chamado encontrado.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
