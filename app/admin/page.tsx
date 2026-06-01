import { BarChart3, Gauge, ShieldCheck, Star, Users } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.ADMIN) redirect("/cliente");
  const [tickets, users, slaOk, slaViolado, categories, technicians, rating] = await Promise.all([
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Administracao</h1>
        <p className="text-sm text-muted-foreground">Relatorios, usuarios, SLA, categorias e configuracoes do service desk.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Chamados" value={tickets} icon={BarChart3} />
        <StatCard label="Usuarios" value={users} icon={Users} tone="text-sky-300" />
        <StatCard label="SLA cumprido" value={slaOk} icon={ShieldCheck} tone="text-emerald-300" />
        <StatCard label="SLA violado" value={slaViolado} icon={Gauge} tone="text-red-300" />
        <StatCard label="Avaliacao media" value={(rating._avg.score ?? 0).toFixed(1)} icon={Star} tone="text-amber-300" />
      </section>
      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Chamados por categoria</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><TR><TH>Categoria</TH><TH>Volume</TH></TR></THead>
              <TBody>{categories.map((item) => <TR key={item.id}><TD>{item.name}</TD><TD>{item._count.tickets}</TD></TR>)}</TBody>
            </Table>
          </CardContent>
        </Card>
        <Card id="usuarios">
          <CardHeader><CardTitle>Chamados por tecnico</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <THead><TR><TH>Tecnico</TH><TH>Fila</TH></TR></THead>
              <TBody>{technicians.map((item) => <TR key={item.id}><TD>{item.name}</TD><TD>{item._count.assignedTickets}</TD></TR>)}</TBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
