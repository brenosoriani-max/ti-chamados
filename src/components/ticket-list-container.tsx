import "reflect-metadata";
import { initializeDatabase } from "@/lib/database";
import { TicketTable } from "@/components/ticket-table";
import { Role } from "@/types";
import { findTicketsWithRelations, countTickets, type TicketFilter } from "@/lib/ticket-queries";

interface TicketListContainerProps {
  filter: TicketFilter;
  userRole: Role;
  userId: string;
  page?: number;
  pageSize?: number;
}

export async function TicketListContainer({ filter, userRole, userId, page, pageSize }: TicketListContainerProps) {
  await initializeDatabase();
  const { tickets, total, page: currentPage, pageSize: currentPageSize } = await findTicketsWithRelations(filter, page, pageSize);

  const pageQuery: Record<string, string | boolean | undefined> = {
    q: filter.q,
    status: filter.status,
    priority: filter.priority,
    archived: filter.isArchived,
    sort: filter.sortOrder === "ASC" ? "oldest" : "newest",
  };

  if (filter.clienteId) {
    pageQuery.clienteId = filter.clienteId;
  }

  if (filter.assigneeId) {
    pageQuery.assigneeId = filter.assigneeId;
  }

  return (
    <TicketTable
      tickets={tickets}
      userRole={userRole}
      userId={userId}
      total={total}
      page={currentPage}
      pageSize={currentPageSize}
      baseHref="/tickets"
      baseQuery={pageQuery}
    />
  );
}

export async function ArchivedCountContainer({
  filter,
  isArchived,
}: {
  filter: TicketFilter;
  isArchived: boolean;
}) {
  await initializeDatabase();
  const archivedCount = await countTickets({ ...filter, isArchived: !isArchived });

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
