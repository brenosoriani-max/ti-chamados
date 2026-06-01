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
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <THead>
          <TR>
            <TH>Numero</TH>
            <TH>Assunto</TH>
            <TH>Status</TH>
            <TH>Prioridade</TH>
            <TH>SLA</TH>
            <TH>Atualizacao</TH>
          </TR>
        </THead>
        <TBody>
          {tickets.map((ticket) => {
            const hours = hoursUntil(ticket.slaDueAt);
            return (
              <TR key={ticket.id}>
                <TD className="font-medium">
                  <Link href={`/tickets/${ticket.id}`} className="hover:text-primary">
                    {ticket.number}
                  </Link>
                </TD>
                <TD>
                  <p className="font-medium">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">{ticket.category?.name ?? "Sem categoria"} {ticket.assignee ? `- ${ticket.assignee.name}` : ""}</p>
                </TD>
                <TD><StatusBadge status={ticket.status} /></TD>
                <TD><PriorityBadge priority={ticket.priority} /></TD>
                <TD className={hours < 0 ? "text-red-400" : hours < 2 ? "text-amber-300" : "text-emerald-300"}>
                  {hours < 0 ? `${Math.abs(hours)}h vencido` : `${hours}h restantes`}
                </TD>
                <TD>{formatDateTime(ticket.updatedAt)}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
