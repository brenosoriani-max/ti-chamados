import { Activity, AlertTriangle, Clock3, Monitor, Wifi } from "lucide-react";
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
  const [tickets, pendentes, criticos, vencidos, tecnicos, onlineMachines, activeSessions, recentRemoteSessions] = await Promise.all([
    prisma.ticket.findMany({ include: { customer: true, assignee: true, category: true }, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }] }),
    prisma.ticket.count({ where: { status: { in: ["ABERTO", "EM_ANALISE", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE"] } } }),
    prisma.ticket.count({ where: { priority: "CRITICA", status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.ticket.count({ where: { slaDueAt: { lt: new Date() }, status: { notIn: ["ENCERRADO", "CANCELADO"] } } }),
    prisma.user.count({ where: { role: "TECNICO", isActive: true } }),
    prisma.equipment.count({ where: { isOnline: true } }),
    prisma.remoteSession.count({ where: { isActive: true } }),
    prisma.remoteSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { equipment: true, requestedBy: true, ticket: true }
    })
  ]);

  return (
    <AppShell>
      <div className="max-w-full min-h-[calc(100vh-6rem)] space-y-8 px-0 md:px-2">
        <div className="mb-6 space-y-2">
          <h1 className="text-4xl font-bold">Fila de Suporte</h1>
          <p className="max-w-3xl text-base text-muted-foreground">Acompanhe os chamados em tempo real e gerencie prioridades, SLA e sessões remotas com mais facilidade.</p>
        </div>
        <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-8 w-full">
        <StatCard label="Pendentes" value={pendentes} icon={Clock3} tone="text-amber-300" />
        <StatCard label="Críticos" value={criticos} icon={AlertTriangle} tone="text-red-300" />
        <StatCard label="Máquinas Online" value={onlineMachines} icon={Monitor} tone="text-emerald-300" />
        <StatCard label="Sessões Ativas" value={activeSessions} icon={Wifi} tone="text-sky-300" />
      </section>
      <section className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,360px)] mb-8">
        <div className="space-y-6">
          <Card className="border-emerald-500/20 bg-emerald-500/5 lg:sticky lg:top-20">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Suporte Remoto</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Últimas conexões ativas</p>
                </div>
                <Activity className="h-5 w-5 text-emerald-500 flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRemoteSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentRemoteSessions.map((session) => (
                    <div key={session.id} className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium truncate">{session.equipment?.machineName ?? session.userName}</p>
                          <p className="text-xs text-muted-foreground">Chamado: {session.ticket?.number ?? "-"}</p>
                        </div>
                        <Badge variant={session.isActive ? "success" : "warning"} className="self-start sm:self-auto">{session.isActive ? "Ativa" : "Finalizada"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full border border-white/10 bg-background/70 px-2 py-1">{session.connectionType}</span>
                        <span className="rounded-full border border-white/10 bg-background/70 px-2 py-1">{session.mode}</span>
                        <span className="rounded-full border border-white/10 bg-background/70 px-2 py-1">{session.requestedBy?.name ?? "Desconhecido"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma sessão remota recente. Os suportes iniciados aparecerão aqui automaticamente.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Como Usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Siga os passos abaixo para iniciar uma sessão remota com o cliente:</p>
              <ul className="list-inside list-disc space-y-2 pl-4">
                <li>Localize a máquina do cliente no ticket.</li>
                <li>Escolha a sessão ativa e o modo de acesso.</li>
                <li>Envie a solicitação e verifique o log.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 w-full">
        {columns.map((column) => (
          <div key={column} className="flex min-h-[360px] flex-col rounded-3xl border border-white/10 bg-card/60 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <h2 className="text-sm font-semibold">{formatTicketStatus(column)}</h2>
              <Badge variant="secondary" className="bg-primary/20 text-primary">{tickets.filter((ticket) => ticket.status === column).length}</Badge>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
              <div className="space-y-3 overflow-y-auto pr-1">
                {tickets.filter((ticket) => ticket.status === column).map((ticket) => {
                  const hours = hoursUntil(ticket.slaDueAt);
                  return (
                    <Card key={ticket.id} className="rounded-3xl bg-background/70 border border-white/10 transition-colors hover:border-primary/30 hover:shadow-md">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-xs font-semibold text-muted-foreground">{ticket.number}</CardTitle>
                          <PriorityBadge priority={ticket.priority} />
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 p-3 pt-0">
                        <p className="text-sm font-medium truncate">{ticket.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{ticket.customer.name} - {ticket.category.name}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{ticket.assignee?.name ?? "Sem responsavel"}</span>
                          <span className={hours < 0 ? "text-red-300" : hours < 2 ? "text-amber-300" : "text-emerald-300"}>{hours < 0 ? "Vencido" : `${hours}h`}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </section>
      </div>
    </AppShell>
  );
}
