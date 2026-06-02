import { Clock, FolderCheck, Inbox, LifeBuoy } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { TicketTable } from "@/components/ticket-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTicketAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function ClientePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) redirect("/suporte");
  const where = session.role === Role.CLIENTE ? { customerId: session.id } : {};
  const [tickets, categories] = await Promise.all([
    prisma.ticket.findMany({ where, include: { category: true, assignee: true }, orderBy: { updatedAt: "desc" }, take: 5 }),
    prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto flex flex-col gap-12 pt-4">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Inbox className="h-3 w-3" />
            Portal do Colaborador
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-none">Como podemos ajudar?</h1>
          <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
            Sua ferramenta interna para suporte técnico. Descreva seu problema abaixo e nossa equipe de TI resolverá o mais rápido possível.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <Card className="glass-card border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] p-2 rounded-[2.5rem] overflow-hidden">
            <div className="h-2 w-full premium-gradient" />
            <CardHeader className="p-10 pb-6">
              <CardTitle className="text-3xl font-black tracking-tight">Novo Chamado</CardTitle>
              <p className="text-muted-foreground font-medium">Preencha o formulário abaixo com os detalhes da sua solicitação.</p>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <form action={createTicketAction} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Título da Solicitação
                  </label>
                  <Input 
                    name="title" 
                    placeholder="Ex: Não consigo acessar minha conta do Outlook" 
                    className="h-14 text-lg font-bold rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.05] transition-all"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    Descrição do Problema
                  </label>
                  <Textarea 
                    name="description" 
                    placeholder="Conte-nos o que está acontecendo... Quanto mais detalhes melhor!" 
                    className="min-h-[200px] text-base font-medium rounded-2xl bg-white/[0.03] border-white/5 focus:bg-white/[0.05] transition-all resize-none p-4"
                    required 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Categoria
                    </label>
                    <Select name="categoryId" defaultValue="" required className="h-14 rounded-2xl bg-white/[0.03] border-white/5">
                      <option value="" disabled>Selecione uma categoria</option>
                      {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] items-center gap-2 flex font-black uppercase tracking-widest text-muted-foreground/60 ml-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Urgência
                    </label>
                    <Select name="priority" defaultValue="MEDIA" className="h-14 rounded-2xl bg-white/[0.03] border-white/5">
                      <option value="BAIXA">Baixa - Uso normal possível</option>
                      <option value="MEDIA">Média - Trabalho afetado</option>
                      <option value="ALTA">Alta - Criticamente afetado</option>
                      <option value="CRITICA">Crítica - Totalmente paralisado</option>
                    </Select>
                  </div>
                </div>

                <Button className="w-full h-16 rounded-3xl premium-gradient text-lg font-black shadow-2xl shadow-teal-500/30 hover:scale-[1.01] transition-all active:scale-[0.98] group">
                  ENVIAR CHAMADO AGORA
                  <Inbox className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>
            </CardContent>
          </Card>

          <aside className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Atividades Recentes</h3>
              <div className="space-y-4">
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <div key={ticket.id} className="group p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded-lg">#{ticket.number}</span>
                        <span className="text-[10px] font-bold text-muted-foreground/60">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-bold text-sm truncate group-hover:text-primary transition-colors">{ticket.title}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-lg border border-white/5">{ticket.status.replaceAll('_', ' ')}</span>
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center opacity-20">
                    <Clock className="h-8 w-8" />
                    <p className="mt-2 text-[10px] font-black uppercase">Nenhum registro</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/5">
                Ver Histórico Completo
              </Button>
            </div>

            <Card className="premium-gradient text-white border-none shadow-2xl rounded-[2.5rem] p-8 space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                <LifeBuoy className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black">Ver Meus Chamados</h4>
                <p className="text-white/70 text-sm font-medium">Confira o status e acompanhe a resolução dos seus chamados.</p>
              </div>
              <Button className="w-full py-4 rounded-2xl bg-white text-primary text-xs font-black shadow-xl">
                Ver Meus Chamados
              </Button>
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
