import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime, hoursUntil, cn } from "@/lib/utils";
import { TicketArchiveButton } from "@/components/ticket-archive-button";

type TicketRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  isArchived: boolean;
  customerId: string;
  createdAt: Date;
  updatedAt: Date;
  slaDueAt: Date;
  category?: { name: string } | null;
  assignee?: { name: string } | null;
};

export function TicketTable({ tickets, userRole, userId }: { tickets: TicketRow[], userRole?: string, userId?: string }) {
  const isStaff = userRole === "TECNICO" || userRole === "ADMIN";
  
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
              <TH className="py-3 pr-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</TH>
            </TR>
          </THead>
          <TBody>
            {tickets.map((ticket) => {
              const hours = hoursUntil(ticket.slaDueAt);
              const isOverdue = hours < 0;
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
                    <p className="font-bold text-sm tracking-tight">{ticket.title}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/60">{ticket.category?.name ?? "Geral"}</p>
                  </TD>
                  <TD className="py-4 text-center"><StatusBadge status={ticket.status} /></TD>
                  <TD className="py-4 text-center"><PriorityBadge priority={ticket.priority} /></TD>
                  <TD className="py-4 text-center">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-md inline-block min-w-[100px]",
                      isOverdue ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {isOverdue ? `ATRASADO ${Math.abs(hours)}h` : `${hours}h restantes`}
                    </span>
                  </TD>
                  <TD className="py-4 text-right pr-6">
                    {(isStaff || ticket.customerId === userId) && (
                      <TicketArchiveButton ticketId={ticket.id} isArchived={ticket.isArchived} />
                    )}
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
