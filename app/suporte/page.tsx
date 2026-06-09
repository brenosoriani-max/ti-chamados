import { Suspense } from "react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SupportQueueContainer } from "@/components/support-queue-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/cliente");

  return (
    <AppShell>
      <div className="space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fila de Atendimento</h1>
            <p className="text-sm text-muted-foreground">Monitoramento em tempo real de chamados e equipamentos.</p>
          </div>
        </header>

        <Suspense fallback={
          <div className="space-y-10">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
               {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
            <Skeleton className="h-[500px] w-full rounded-2xl" />
          </div>
        }>
          <SupportQueueContainer />
        </Suspense>
      </div>
    </AppShell>
  );
}
