import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CircleHelp, FileText, MessageSquare, Sparkles } from "lucide-react";
import { ClientTicketsContainer } from "@/components/client-tickets-container";
import { CreateTicketForm } from "@/components/create-ticket-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSession } from "@/lib/auth";
import { Role } from "@/types";
import { getEnabledCategories } from "@/lib/categories";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) redirect("/suporte");

  const categories = (await getEnabledCategories()).map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border border-border/60 bg-card shadow-sm"><CardContent className="p-0"><div className="border-b border-border/60 px-6 py-5 sm:px-7"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div><div><h2 className="font-bold tracking-tight">Abrir um novo chamado</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Quanto mais detalhes você informar, mais rápido poderemos ajudar.</p></div></div></div><div className="p-6 sm:p-7"><CreateTicketForm categories={categories} /></div></CardContent></Card>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm"><div className="mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold">Acompanhe seus chamados</h3></div><Suspense fallback={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>}><ClientTicketsContainer clienteId={session.role === Role.CLIENTE ? session.id : undefined} /></Suspense><Button asChild variant="ghost" className="mt-3 h-10 w-full rounded-xl text-xs font-semibold text-primary hover:bg-primary/5"><Link href="/tickets">Ver todos os chamados</Link></Button></div>
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-5 dark:border-sky-900/50 dark:bg-sky-950/20"><div className="flex items-center gap-2 text-sky-700 dark:text-sky-300"><CircleHelp className="h-4 w-4" /><h3 className="text-sm font-bold">Para agilizar o atendimento</h3></div><ul className="mt-3 space-y-2 text-xs leading-5 text-sky-800/80 dark:text-sky-200/80"><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Inclua a mensagem de erro, se houver.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Informe quando o problema começou.</li><li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Descreva o que você já tentou fazer.</li></ul></div>
        </aside>
      </div>
    </div>
  );
}
