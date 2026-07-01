import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ClientTicketsContainer } from "@/components/client-tickets-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { createTicketAction } from "@/app/actions";
import { getDataSource } from "@/lib/db";
import { Category } from "@/entities/Category";
import { getSession } from "@/lib/auth";
import { Role } from "@/types";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMINISTRADOR) redirect("/suporte");

  const ds = await getDataSource();
  const categoryRepo = ds.getRepository(Category);
  const categories = await categoryRepo.find({
    where: { isActive: true },
    order: { name: "ASC" },
    select: ["id", "name"],
  });

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight">Novo Chamado</h1>
        <p className="text-sm text-muted-foreground font-medium">Capture detalhes do problema para uma resolução rápida.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card className="border-none shadow-2xl shadow-primary/5 bg-card/40 rounded-3xl border border-border/20">
          <CardContent className="p-8">
            <form action={createTicketAction} className="space-y-7">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">O que está acontecendo?</label>
                <Input
                  name="title"
                  placeholder="Ex: Não consigo acessar o e-mail corporativo"
                  className="h-12 bg-background border-border/40 focus:border-primary/40 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Descrição Detalhada</label>
                <Textarea
                  name="description"
                  placeholder="Forneça o máximo de informações possível..."
                  className="min-h-[180px] bg-background border-border/40 focus:border-primary/40 rounded-xl resize-none text-sm leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Área Afetada</label>
                  <Select name="categoryId" required className="h-12 bg-background border-border/40 focus:border-primary/40 rounded-xl text-sm">
                    <option value="" disabled>Selecione uma categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Urgência</label>
                  <Select name="priority" defaultValue="MEDIA" className="h-12 bg-background border-border/40 focus:border-primary/40 rounded-xl text-sm">
                    <option value="BAIXA">Baixa - Rotina</option>
                    <option value="MEDIA">Média - Importante</option>
                    <option value="ALTA">Alta - Urgente</option>
                    <option value="URGENTE">Urgente - Impedimento Total</option>
                  </Select>
                </div>
              </div>

              <Button className="w-full h-14 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-all">
                Abrir Chamado Agora
              </Button>
            </form>
          </CardContent>
        </Card>

        <aside className="space-y-8">
          <div className="space-y-3">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Suas Solicitações</h3>
            <Suspense fallback={
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
              </div>
            }>
              <ClientTicketsContainer clienteId={session.role === Role.CLIENTE ? session.id : undefined} />
            </Suspense>
          </div>

          <Button asChild variant="ghost" className="w-full h-12 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5">
            <Link href="/tickets">Ver histórico completo</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
