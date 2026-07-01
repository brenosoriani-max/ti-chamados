import { prisma } from "@/lib/prisma";
import { TicketTable } from "@/components/ticket-table";
import { Role } from "@/types";

interface TicketListContainerProps {
  where: any;
  userRole: Role;
  userId: string;
}

export async function TicketListContainer({ where, userRole, userId }: TicketListContainerProps) {
  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      priority: true,
      isArchived: true,
      customerId: true,
      slaDueAt: true,
      updatedAt: true,
      category: { select: { name: true } },
      customer: { select: { name: true } },
      equipment: { select: { id: true, machineName: true, hostname: true, ipAddress: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <TicketTable tickets={tickets} userRole={userRole} userId={userId} />;
}

export async function ArchivedCountContainer({ where, isArchived }: { where: any, isArchived: boolean }) {
  const archivedCount = await prisma.ticket.count({ 
    where: { ...where, isArchived: !isArchived } 
  });

  if (archivedCount === 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between">
      <p className="text-sm text-amber-700 font-medium">
        Você possui {archivedCount} {archivedCount === 1 ? 'chamado arquivado' : 'chamados arquivados'}.
      </p>
      <a href={`/tickets?archived=${!isArchived}`} className="text-amber-700 font-bold hover:underline text-sm">
        VER {isArchived ? 'ATIVOS' : 'ARQUIVADOS'}
      </a>
    </div>
  );
}
