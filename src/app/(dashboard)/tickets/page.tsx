import { Suspense } from "react";
import { ArrowLeft, Search, Ticket } from "lucide-react";
import { Role } from "@/types";
import { redirect } from "next/navigation";
import Link from "next/link";

import { TicketListContainer, ArchivedCountContainer } from "@/components/ticket-list-container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; archived?: string; priority?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q, status, archived, priority } = await searchParams;
  const isArchived = archived === "true";

  const filter = {
    isArchived,
    ...(session.role === Role.CLIENTE ? { clienteId: session.id } : {}),
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {isArchived && (
            <Button asChild variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-muted/50 border border-border/40 hover:bg-muted transition-all">
              <Link href="/tickets?archived=false">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
              <Ticket className="h-3 w-3" />
              Solicitações
            </div>
            <h1 className="text-3xl font-black tracking-tight">Chamados {isArchived ? "Arquivados" : ""}</h1>
            <p className="text-sm text-muted-foreground font-medium">Gerencie suas solicitações e acompanhe o progresso.</p>
          </div>
        </div>
        <Button asChild className="rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/10">
          <Link href="/cliente">NOVO CHAMADO</Link>
        </Button>
      </header>

      <Suspense fallback={<Skeleton className="h-20 w-full rounded-3xl" />}>
         <ArchivedCountContainer filter={filter} isArchived={isArchived} />
      </Suspense>

      <div className="bg-card/40 border border-border/20 p-4 rounded-3xl backdrop-blur-md">
        <form action="/tickets" method="GET" className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input 
              name="q"
              className="w-full bg-background/50 border-border/40 h-11 pl-11 rounded-xl text-sm transition-all focus:border-primary/40" 
              placeholder="Pesquisar por título ou número..." 
              defaultValue={q}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select 
              name="archived" 
              defaultValue={isArchived ? "true" : "false"}
              className="h-11 w-full md:w-36 rounded-xl bg-background/50 border-border/40 text-[10px] font-bold uppercase tracking-widest"
            >
              <option value="false">Ativos</option>
              <option value="true">Arquivados</option>
            </Select>
            <Select 
              name="status" 
              defaultValue={status || ""} 
              className="h-11 w-full md:w-44 rounded-xl bg-background/50 border-border/40 text-[10px] font-bold uppercase tracking-widest"
            >
              <option value="">Todos Status</option>
              <option value="ABERTO">Aberto</option>
              <option value="EM_ANALISE">Em Análise</option>
              <option value="EM_ATENDIMENTO">Em Atendimento</option>
              <option value="AGUARDANDO_CLIENTE">Aguardando Cliente</option>
              <option value="RESOLVIDO">Resolvido</option>
            </Select>
            <Select
              name="priority"
              defaultValue={priority || ""}
              className="h-11 w-full md:w-40 rounded-xl bg-background/50 border-border/40 text-[10px] font-bold uppercase tracking-widest"
            >
              <option value="">Todas prioridades</option>
              <option value="CRITICA">Crítica</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </Select>
            <Button type="submit" variant="secondary" className="h-11 rounded-xl px-6 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
              Filtrar
            </Button>
          </div>
        </form>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-3xl" />
          ))}
        </div>
      }>
        <TicketListContainer filter={filter} userRole={session.role} userId={session.id} />
      </Suspense>
    </div>
  );
}
