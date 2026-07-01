import { Suspense } from "react";
import { Role } from "@/types";
import { redirect } from "next/navigation";
import { Headset } from "lucide-react";
import { SupportQueueContainer } from "@/components/support-queue-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/cliente");

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Headset className="h-3 w-3" />
            Central de Suporte
          </div>
          <h1 className="text-3xl font-black tracking-tight">Fila de Atendimento</h1>
          <p className="text-sm text-muted-foreground font-medium">Monitoramento em tempo real de chamados e equipamentos.</p>
        </div>
      </header>

      <Suspense fallback={
        <div className="space-y-10">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
             {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}
          </div>
          <Skeleton className="h-[600px] w-full rounded-3xl" />
        </div>
      }>
        <SupportQueueContainer />
      </Suspense>
    </div>
  );
}
