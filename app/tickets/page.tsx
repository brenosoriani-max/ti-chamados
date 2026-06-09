import { Suspense } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { TicketListContainer, ArchivedCountContainer } from "@/components/ticket-list-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q, status, archived } = await searchParams;
  const isArchived = archived === "true";

  const where: any = { isArchived };
  if (session.role === Role.CLIENTE) {
    where.customerId = session.id;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { number: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status) {
    where.status = status;
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isArchived && (
              <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-background border border-border/40 hover:bg-muted font-bold transition-all">
                <Link href="/tickets?archived=false">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Chamados {isArchived ? "Arquivados" : ""}</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas solicitações e acompanhe o progresso.</p>
            </div>
          </div>
          <Button asChild className="rounded-xl h-10 px-6 font-bold text-xs">
            <Link href="/cliente">NOVO CHAMADO</Link>
          </Button>
        </header>

        <Suspense fallback={<Skeleton className="h-20 w-full rounded-xl" />}>
           <ArchivedCountContainer where={where} isArchived={isArchived} />
        </Suspense>

        <div className="bg-card border border-border/40 p-2 rounded-xl shadow-sm">
          <form action="/tickets" method="GET" className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                name="q"
                className="w-full bg-background border-transparent h-10 pl-9 rounded-lg text-sm transition-all focus:border-primary/20" 
                placeholder="Pesquisar..." 
                defaultValue={q}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select 
                name="archived" 
                defaultValue={isArchived ? "true" : "false"}
                className="h-10 w-full md:w-40 rounded-lg bg-background border-transparent text-xs font-bold"
              >
                <option value="false">Ativos</option>
                <option value="true">Arquivados</option>
              </Select>
              <Select 
                name="status" 
                defaultValue={status || ""} 
                className="h-10 w-full md:w-40 rounded-lg bg-background border-transparent text-xs font-bold"
              >
                <option value="">Status</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="EM_ATENDIMENTO">Em Atendimento</option>
                <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
                <option value="RESOLVIDO">Resolvido</option>
              </Select>
              <Button type="submit" variant="secondary" className="h-10 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest">
                Filtrar
              </Button>
            </div>
          </form>
        </div>

        <Suspense fallback={
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        }>
          <TicketListContainer where={where} userRole={session.role} userId={session.id} />
        </Suspense>
      </div>
    </AppShell>
  );
}
