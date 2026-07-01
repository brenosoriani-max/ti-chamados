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
    <div className="flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest leading-none mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Sistema de Gestão IT
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground font-medium">Controle central de operações, usuários e performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl border-border/40 bg-card/40 h-12 px-6 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
            <Settings className="mr-2 h-3.5 w-3.5" />
            Configurações
          </Button>
        </div>
      </header>

      <Suspense fallback={
        <div className="space-y-10">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-3xl" />)}
          </div>
          <div className="grid gap-10 lg:grid-cols-2">
             <Skeleton className="h-[400px] w-full rounded-3xl" />
             <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
        </div>
      }>
        <AdminStatsContainer />
      </Suspense>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-2xl shadow-teal-500/5 bg-card/40 rounded-3xl overflow-hidden border border-border/20 group hover:border-primary/20 transition-all">
          <div className="h-1.5 w-full premium-gradient opacity-80" />
          <CardHeader className="p-8 pb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle className="text-xl font-black text-foreground">Gestão de Equipe</CardTitle>
            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
              Administre os acessos dos técnicos e colaboradores do sistema de chamados.
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <Button asChild className="w-full h-14 rounded-2xl premium-gradient text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-transform">
              <Link href="/admin/usuarios">GERENCIAR USUÁRIOS</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-primary/10 bg-primary/5 p-8 rounded-[2rem] flex flex-col justify-between">
          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-background border border-primary/20 flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h4 className="font-black text-lg tracking-tight text-primary uppercase">Módulo de Segurança</h4>
              <p className="text-[10px] font-bold text-primary/60 uppercase mt-1 tracking-[0.1em]">Rastreamento de IP Ativo</p>
            </div>
          </div>
          <p className="text-xs text-primary/50 font-medium italic mt-6">
            Todas as ações administrativas estão sendo logadas para fins de auditoria interna.
          </p>
        </Card>
      </div>
    </div>
  );
}
