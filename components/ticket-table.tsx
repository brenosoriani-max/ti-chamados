import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime, hoursUntil } from "@/lib/utils";

type TicketRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date;
  updatedAt: Date;
  slaDueAt: Date;
  category?: { name: string } | null;
  assignee?: { name: string } | null;
};

export function TicketTable({ tickets }: { tickets: TicketRow[] }) {
  return (
    <div className="glass-card overflow-hidden rounded-3xl border-none shadow-2xl">
      <Table>
        <THead className="bg-white/5">
          <TR className="hover:bg-transparent border-b border-white/5">
            <TH className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Número</TH>
            <TH className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Assunto</TH>
            <TH className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground uppercase">Status</TH>
            <TH className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prioridade</TH>
            <TH className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">SLA</TH>
            <TH className="py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right pr-6">Atualização</TH>
          </TR>
        </THead>
        <TBody>
          {tickets.map((ticket) => {
            const hours = hoursUntil(ticket.slaDueAt);
            const isOverdue = hours < 0;
            return (
              <TR key={ticket.id} className="group border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <TD className="py-4 font-bold text-xs">
                  <Link href={`/tickets/${ticket.id}`} className="hover:text-primary transition-colors bg-muted/50 px-2 py-1 rounded-lg">
                    #{ticket.number}
                  </Link>
                </TD>
                <TD className="py-4">
                  <p className="font-bold text-sm tracking-tight group-hover:text-primary transition-colors">{ticket.title}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 mt-0.5">{ticket.category?.name ?? "Geral"} {ticket.assignee ? `• ${ticket.assignee.name}` : ""}</p>
                </TD>
                <TD className="py-4"><StatusBadge status={ticket.status} /></TD>
                <TD className="py-4"><PriorityBadge priority={ticket.priority} /></TD>
                <TD className="py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className={`text-[10px] font-black ${isOverdue ? "text-red-400" : hours < 2 ? "text-amber-400" : "text-emerald-400"}`}>
                      {isOverdue ? `${Math.abs(hours)}H ATRASADO` : `${hours}H RESTANTES`}
                    </span>
                    <div className="w-12 h-1 bg-muted/30 rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${isOverdue ? "bg-red-500" : "bg-primary"}`} style={{ width: isOverdue ? '100%' : Math.max(10, (hours/24)*100) + '%' }} />
                    </div>
                  </div>
                </TD>
                <TD className="py-4 text-right pr-6">
                  <span className="text-[10px] font-bold text-muted-foreground/60">{formatDateTime(ticket.updatedAt)}</span>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
