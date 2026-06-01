import { Activity, AlertTriangle, CheckCircle2, Clock3, Monitor, UserCheck, Wifi } from "lucide-react";
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Fila de suporte</h1>
        <p className="text-sm text-muted-foreground">Kanban operacional com prioridade, SLA e responsavel.</p>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pendentes" value={pendentes} icon={Clock3} tone="text-amber-300" />
        <StatCard label="Criticos" value={criticos} icon={AlertTriangle} tone="text-red-300" />
        <StatCard label="Maquinas online" value={onlineMachines} icon={Monitor} tone="text-emerald-300" />
        <StatCard label="Sessões ativas" value={activeSessions} icon={Wifi} tone="text-sky-300" />
      </section>
      <section className="mt-6 grid gap-4 xl:grid-cols-[2fr_380px]">
        <div className="space-y-4">
          <Card className="border-emerald-500/10 bg-emerald-500/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Suporte remoto</CardTitle>
                  <p className="text-sm text-muted-foreground">Acompanhe as conexões ativas e os últimos acessos feitos pelos técnicos.</p>
                </div>
                <Activity className="h-5 w-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentRemoteSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentRemoteSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{session.equipment?.machineName ?? session.userName}</p>
                          <p className="text-xs text-muted-foreground">Chamado: {session.ticket?.number ?? "-"}</p>
                        </div>
                        <Badge variant={session.isActive ? "success" : "warning"}>{session.isActive ? "Ativa" : "Finalizada"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{session.connectionType}</span>
                        <span>{session.mode}</span>
                        <span>{session.requestedBy?.name ?? "Desconhecido"}</span>
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
            <CardHeader>
              <CardTitle>Como usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Para iniciar suporte remoto, abra o chamado e selecione a sessão disponível do equipamento do usuário.</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Localize a máquina do cliente no ticket.</li>
                <li>Escolha a sessão ativa e o modo de acesso.</li>
                <li>Envie a solicitação e verifique o log.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
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
