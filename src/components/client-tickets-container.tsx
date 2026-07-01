import { getDataSource } from "@/lib/db";
import { Ticket } from "@/entities/Ticket";
import Link from "next/link";

export async function ClientTicketsContainer({ clienteId }: { clienteId?: string }) {
  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);

  const qb = ticketRepo
    .createQueryBuilder("ticket")
    .select(["ticket.id", "ticket.protocolo", "ticket.titulo", "ticket.status", "ticket.updatedAt"])
    .where("ticket.isArchived = :archived", { archived: false })
    .orderBy("ticket.updatedAt", "DESC")
    .take(5);

  if (clienteId) {
    qb.andWhere("ticket.clienteId = :clienteId", { clienteId });
  }

  const tickets = await qb.getMany();

  if (tickets.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-border/40 rounded-xl">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Nenhum chamado aberto</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
          <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-primary">{ticket.protocolo}</span>
              <span className="text-[9px] text-muted-foreground font-medium">
                {new Date(ticket.updatedAt).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{ticket.titulo}</p>
            <span className="text-[9px] uppercase font-semibold text-muted-foreground mt-1">
              {ticket.status.replace("_", " ")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
