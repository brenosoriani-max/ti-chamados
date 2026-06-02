import Link from "next/link";
import { BarChart3, Gauge, ShieldCheck, Star, Users, UserPlus, Settings } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createUserAction } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) redirect("/cliente");
  const [tickets, usersCount, slaOk, slaViolado, categories, technicians, rating] = await Promise.all([
    prisma.ticket.count(),
    prisma.user.count(),
    prisma.ticket.count({ where: { slaDueAt: { gte: new Date() } } }),
    prisma.ticket.count({ where: { slaDueAt: { lt: new Date() }, status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.category.findMany({ include: { _count: { select: { tickets: true } } }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: "TECNICO" }, include: { _count: { select: { assignedTickets: true } } }, orderBy: { name: "asc" } }),
    prisma.rating.aggregate({ _avg: { score: true } })
  ]);

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

        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total Chamados" value={tickets} icon={BarChart3} />
          <StatCard label="Usuários Ativos" value={usersCount} icon={Users} tone="text-sky-400" />
          <StatCard label="SLA no Prazo" value={slaOk} icon={ShieldCheck} tone="text-emerald-400" />
          <StatCard label="SLA Violado" value={slaViolado} icon={Gauge} tone="text-red-400" />
          <StatCard label="Rating Médio" value={(rating._avg.score ?? 0).toFixed(1)} icon={Star} tone="text-amber-400" />
        </section>

        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="space-y-6">
            <Card className="glass-card border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Performance por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <THead>
                    <TR className="border-white/5">
                      <TH className="text-[10px] font-black uppercase tracking-widest">Categoria</TH>
                      <TH className="text-[10px] font-black uppercase tracking-widest text-right">Volume de Chamados</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {categories.map((item) => (
                      <TR key={item.id} className="border-white/5 group hover:bg-white/5">
                        <TD className="font-bold text-sm">{item.name}</TD>
                        <TD className="text-right">
                          <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-muted/50 font-bold group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                            {item._count.tickets}
                          </span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-sky-400" />
                  Carga de Trabalho (Técnicos)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <THead>
                    <TR className="border-white/5">
                      <TH className="text-[10px] font-black uppercase tracking-widest">Técnico</TH>
                      <TH className="text-[10px] font-black uppercase tracking-widest text-right">Fila Ativa</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {technicians.map((item) => (
                      <TR key={item.id} className="border-white/5 group hover:bg-white/5">
                        <TD className="font-bold text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center text-[10px] font-black">
                              {item.name.charAt(0)}
                            </div>
                            {item.name}
                          </div>
                        </TD>
                        <TD className="text-right">
                          <span className="inline-flex items-center justify-center h-8 w-12 rounded-lg bg-muted/50 font-bold group-hover:bg-sky-500/20 group-hover:text-sky-400 transition-colors">
                            {item._count.assignedTickets}
                          </span>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="glass-card border-none shadow-2xl overflow-hidden">
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

            <Card className="glass-card border border-primary/10 bg-primary/5 p-8 rounded-3xl">
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
      </div>
    </AppShell>
  );
}
