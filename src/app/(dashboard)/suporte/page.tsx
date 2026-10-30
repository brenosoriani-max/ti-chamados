import { Suspense } from "react";
import { Role } from "@/types";
import { redirect } from "next/navigation";
import { Headset } from "lucide-react";
import { SupportQueueContainer } from "@/components/support-queue-container";
import { KanbanBoard } from "@/components/kanban-board";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { getRepository, initializeDatabase } from "@/lib/database";
import { Ticket } from "@/entities/Ticket";

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const isStaff = session.role === Role.TECNICO || session.role === Role.ADMIN;


  if (session.role === Role.CLIENTE) {
    await initializeDatabase();
    const hasTickets = await getRepository(Ticket).exist({
      where: { clienteId: session.id, isArchived: false },
    });

    if (hasTickets) redirect("/cliente");
  } else if (!isStaff) {
    redirect("/cliente");
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary"><Headset className="h-3 w-3" />Central de Suporte</div>
          <h1 className="text-3xl font-black tracking-tight">Rotina de atendimentos</h1>
          <p className="text-sm font-medium text-muted-foreground">{isStaff ? "Monitoramento em tempo real de chamados e equipamentos." : "Sua fila está pronta para receber o primeiro chamado."}</p>
        </div>
      </header>

      {isStaff ? (
        <Suspense fallback={<div className="space-y-10"><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}</div><Skeleton className="h-[600px] w-full rounded-3xl" /></div>}>
          <SupportQueueContainer />
        </Suspense>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Nenhum chamado na fila no momento.</p>
          <KanbanBoard initialTickets={[]} techList={[]} />
        </div>
      )}
    </div>
  );
}
