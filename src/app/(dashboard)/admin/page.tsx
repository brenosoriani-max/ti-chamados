import { Suspense } from "react";
import Link from "next/link";
import { UserPlus, Settings, ShieldCheck } from "lucide-react";
import { Role } from "@/types";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminStatsContainer } from "@/components/admin-stats-container";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) redirect("/cliente");

  return (
    <div className="flex flex-col gap-6">
      <header className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Dashboard Admin
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-[-0.06em] text-foreground sm:text-4xl">
                Visão geral
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Controle central de operações, usuários e performance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:self-auto">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Operação estável
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-3xl" />
              ))}
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-[300px] w-full rounded-3xl" />
              <Skeleton className="h-[300px] w-full rounded-3xl" />
            </div>
          </div>
        }
      >
        <AdminStatsContainer />
      </Suspense>
    </div>
  );
}
