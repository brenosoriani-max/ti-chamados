import { Suspense } from "react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClientTicketsContainer } from "@/components/client-tickets-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createTicketAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) redirect("/suporte");
  
  const where: any = session.role === Role.CLIENTE ? { customerId: session.id } : {};
  where.isArchived = false;

  const categories = await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Novo Chamado</h1>
          <p className="text-sm text-muted-foreground">Descreva sua solicitação e nossa equipe de TI ajudará você.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <Card className="border-none shadow-sm bg-card/50">
            <CardContent className="p-8">
              <form action={createTicketAction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Assunto</label>
                  <Input 
                    name="title" 
                    placeholder="Ex: Problema com botão de impressão" 
                    className="h-12 bg-background border-transparent focus:border-primary/20 rounded-xl"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Detalhes</label>
                  <Textarea 
                    name="description" 
                    placeholder="Descreva o problema com o máximo de detalhes..." 
                    className="min-h-[160px] bg-background border-transparent focus:border-primary/20 rounded-xl resize-none"
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoria</label>
                    <Select name="categoryId" defaultValue="" required className="h-12 bg-background border-transparent focus:border-primary/20 rounded-xl">
                      <option value="" disabled>Selecione</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Prioridade</label>
                    <Select name="priority" defaultValue="MEDIA" className="h-12 bg-background border-transparent focus:border-primary/20 rounded-xl">
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </Select>
                  </div>
                </div>

                <Button className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                  Criar Chamado
                </Button>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Chamados Recentes</h3>
            
            <Suspense fallback={
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
              </div>
            }>
              <ClientTicketsContainer where={where} />
            </Suspense>

            <Button asChild variant="outline" className="w-full h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest">
              <Link href="/tickets">Ver todos os chamados</Link>
            </Button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
