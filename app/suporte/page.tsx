import { AlertTriangle, CheckCircle2, Clock3, UserCheck } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge } from "@/components/status-badge";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatTicketStatus, hoursUntil } from "@/lib/utils";

const columns = ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "RESOLVIDO"];

export default async function SuportePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/cliente");
  const [tickets, pendentes, criticos, vencidos, tecnicos] = await Promise.all([
    prisma.ticket.findMany({ include: { customer: true, assignee: true, category: true }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }] }),
    prisma.ticket.count({ where: { status: { in: ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.ticket.count({ where: { priority: "CRITICA", status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.ticket.count({ where: { slaDueAt: { lt: new Date() }, status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.user.count({ where: { role: "TECNICO", isActive: true } })
  ]);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Fila de suporte</h1>
        <p className="text-sm text-muted-foreground">Kanban operacional com prioridade, SLA e responsavel.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pendentes" value={pendentes} icon={Clock3} tone="text-amber-300" />
        <StatCard label="Criticos" value={criticos} icon={AlertTriangle} tone="text-red-300" />
        <StatCard label="SLA vencido" value={vencidos} icon={CheckCircle2} tone="text-red-300" />
        <StatCard label="Tecnicos" value={tecnicos} icon={UserCheck} />
      </section>
      <section className="mt-6 grid min-h-[560px] gap-4 overflow-x-auto xl:grid-cols-5">
        {columns.map((column) => (
          <div key={column} className="min-w-72 rounded-lg border bg-card/60">
            <div className="flex items-center justify-between border-b p-3">
              <h2 className="text-sm font-semibold">{formatTicketStatus(column)}</h2>
              <Badge variant="secondary">{tickets.filter((ticket) => ticket.status === column).length}</Badge>
            </div>
            <div className="space-y-3 p-3">
              {tickets.filter((ticket) => ticket.status === column).map((ticket) => {
                const hours = hoursUntil(ticket.slaDueAt);
                return (
                  <Card key={ticket.id} className="bg-background">
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm">{ticket.number}</CardTitle>
                        <PriorityBadge priority={ticket.priority} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4 pt-0">
                      <p className="text-sm font-medium">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">{ticket.customer.name} - {ticket.category.name}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span>{ticket.assignee?.name ?? "Sem responsavel"}</span>
                        <span className={hours < 0 ? "text-red-300" : hours < 2 ? "text-amber-300" : "text-emerald-300"}>{hours < 0 ? "Vencido" : `${hours}h`}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
