import { Suspense } from "react";
import Link from "next/link";
import { UserPlus, Settings, ShieldCheck } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
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
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Painel de Controle
            </div>
            <h1 className="text-4xl font-black tracking-tight">Administração</h1>
            <p className="text-muted-foreground font-medium">Gestão global de usuários, performance e configurações.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl border-dashed border-primary/30 text-primary hover:bg-primary/5">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Button>
          </div>
        </header>

        <Suspense fallback={
          <div className="space-y-8">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
            </div>
            <div className="grid gap-8 lg:grid-cols-2">
               <Skeleton className="h-[400px] w-full rounded-2xl" />
               <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
          </div>
        }>
          <AdminStatsContainer />
        </Suspense>

        <aside className="space-y-6">
          <Card className="glass-card border-none shadow-2xl overflow-hidden max-w-md">
            <div className="h-2 w-full premium-gradient" />
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                Gestão de Equipe
              </CardTitle>
              <p className="text-sm text-muted-foreground font-medium">Adicione ou gerencie os colaboradores e técnicos do sistema.</p>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <Button asChild className="w-full h-14 rounded-2xl premium-gradient text-sm font-black shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-95 transition-transform">
                <Link href="/admin/usuarios">GERENCIAR USUÁRIOS</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border border-primary/10 bg-primary/5 p-8 rounded-3xl max-w-md">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <h4 className="font-black text-sm tracking-tight leading-none text-primary">SISTEMA SEGURO</h4>
                <p className="text-[10px] font-bold text-primary/60 uppercase mt-1 tracking-widest">Acesso Administrador Ativo</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </AppShell>
  );
}
