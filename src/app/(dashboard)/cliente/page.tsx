import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, CircleHelp, FileText, MessageSquare, Send, Sparkles } from "lucide-react";
import { ClientTicketsContainer } from "@/components/client-tickets-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createTicketAction } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { Role } from "@/types";
import { getEnabledCategories } from "@/lib/categories";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) redirect("/suporte");

  const categories = await getEnabledCategories();

  return (
    <div className="mx-auto max-w-6xl space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-7 text-white shadow-xl sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-primary/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/4 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-300"><Sparkles className="h-4 w-4" /> Central de ajuda</div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Olá, {session.name.split(" ")[0]}. Como podemos ajudar?</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Descreva o que aconteceu e nossa equipe acompanhará sua solicitação até a resolução.</p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden border border-border/60 bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-border/60 px-6 py-5 sm:px-7">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div><div><h2 className="font-bold tracking-tight">Abrir um novo chamado</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Quanto mais detalhes você informar, mais rápido poderemos ajudar.</p></div></div>
            </div>
            <form action={createTicketAction} className="space-y-6 p-6 sm:p-7">
              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">1</span>Conte o que está acontecendo</p>
                <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Resumo do problema</label><Input name="title" placeholder="Ex.: Não consigo acessar o e-mail corporativo" className="h-12 bg-background text-sm" required /></div>
                <div className="mt-4 space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Detalhes</label><Textarea name="description" placeholder="Informe mensagens de erro, quando começou e o que você já tentou fazer." className="min-h-[160px] resize-none bg-background text-sm leading-relaxed" required /></div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">2</span>Classifique sua solicitação</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Área afetada</label><Select name="categoryId" required className="h-12 bg-background text-sm"><option value="" disabled>Selecione uma categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>
                  <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Urgência</label><Select name="priority" defaultValue="MEDIA" className="h-12 bg-background text-sm"><option value="BAIXA">Baixa — Rotina</option><option value="MEDIA">Média — Importante</option><option value="ALTA">Alta — Urgente</option><option value="CRITICA">Crítica — Impedimento total</option></Select></div>
                </div>
              </div>

              <Button className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"><Send className="h-4 w-4" /> Enviar chamado</Button>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /><h3 className="text-sm font-bold">Acompanhe seus chamados</h3></div>
            <Suspense fallback={<div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>}><ClientTicketsContainer clienteId={session.role === Role.CLIENTE ? session.id : undefined} /></Suspense>
            <Button asChild variant="ghost" className="mt-3 h-10 w-full rounded-xl text-xs font-semibold text-primary hover:bg-primary/5"><Link href="/tickets">Ver todos os chamados</Link></Button>
          </div>

          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-5 dark:border-sky-900/50 dark:bg-sky-950/20">
            <div className="flex items-center gap-2 text-sky-700 dark:text-sky-300"><CircleHelp className="h-4 w-4" /><h3 className="text-sm font-bold">Para agilizar o atendimento</h3></div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-sky-800/80 dark:text-sky-200/80">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Inclua a mensagem de erro, se houver.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Informe quando o problema começou.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />Descreva o que você já tentou fazer.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
