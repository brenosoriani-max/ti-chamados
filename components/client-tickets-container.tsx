import { prisma } from "@/lib/prisma";
import Link from "next/link";

export async function ClientTicketsContainer({ where }: { where: any }) {
  const tickets = await prisma.ticket.findMany({ 
    where, 
    select: {
      id: true,
      number: true,
      title: true,
      updatedAt: true,
    }, 
    orderBy: { updatedAt: "desc" }, 
    take: 5 
  });

  if (tickets.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-border/40 rounded-xl">
        <p className="text-[10px] font-bold text-muted-foreground uppercase">Nenhum chamado</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tickets.map((ticket) => (
        <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
          <div className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/20 transition-all group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-primary">#{ticket.number}</span>
              <span className="text-[9px] text-muted-foreground font-medium">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
            </div>
            <p className="text-xs font-bold truncate group-hover:text-primary transition-colors">{ticket.title}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
