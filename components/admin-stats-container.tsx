import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { StatCard } from "@/components/stat-card";
import { BarChart3, Gauge, ShieldCheck, Star, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export async function AdminStatsContainer() {
  const [tickets, usersCount, slaOk, slaViolado, categories, technicians, rating] = await Promise.all([
    prisma.ticket.count(),
    prisma.user.count(),
    prisma.ticket.count({ where: { slaDueAt: { gte: new Date() } } }),
    prisma.ticket.count({ where: { slaDueAt: { lt: new Date() }, status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.category.findMany({ 
      select: { id: true, name: true, _count: { select: { tickets: true } } }, 
      orderBy: { name: "asc" } 
    }),
    prisma.user.findMany({ 
      where: { role: Role.TECNICO }, 
      select: { id: true, name: true, _count: { select: { assignedTickets: true } } }, 
      orderBy: { name: "asc" } 
    }),
    prisma.rating.aggregate({ _avg: { score: true } })
  ]);

  return (
    <>
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Chamados" value={tickets} icon={BarChart3} />
        <StatCard label="Usuários Ativos" value={usersCount} icon={Users} tone="text-sky-400" />
        <StatCard label="SLA no Prazo" value={slaOk} icon={ShieldCheck} tone="text-emerald-400" />
        <StatCard label="SLA Violado" value={slaViolado} icon={Gauge} tone="text-red-400" />
        <StatCard label="Rating Médio" value={(rating._avg.score ?? 0).toFixed(1)} icon={Star} tone="text-amber-400" />
      </section>

      <div className="grid gap-8">
        <div className="grid gap-8 lg:grid-cols-2">
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
                    <TH className="text-[10px] font-black uppercase tracking-widest text-right">Volume</TH>
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
                    <TH className="text-[10px] font-black uppercase tracking-widest text-right">Fila</TH>
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
      </div>
    </>
  );
}
