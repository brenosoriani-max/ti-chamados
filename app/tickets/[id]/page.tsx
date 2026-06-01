import { Star } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { RemoteAccessPanel } from "@/components/remote-access-panel";
import { TicketMessageForm } from "@/components/ticket-message-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ...(session.role === Role.CLIENTE ? { customerId: session.id } : {}) },
    include: {
      customer: true,
      assignee: true,
      category: true,
      subCategory: true,
      equipment: true,
      remoteSessions: { orderBy: { createdAt: "desc" } },
      rating: true,
      messages: { include: { author: true }, orderBy: { createdAt: "asc" } },
      history: { include: { actor: true }, orderBy: { createdAt: "asc" } }
    }
  });

  if (!ticket) {
    return <AppShell><p>Chamado não encontrado.</p></AppShell>;
  }

  const visibleMessages = ticket.messages.filter((message) => !message.isInternal || session.role !== Role.CLIENTE);

  return (
    <AppShell>
      <div className="mb-8 rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 to-primary/5 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">{ticket.number}</p>
            <h1 className="text-3xl lg:text-4xl font-bold leading-tight">{ticket.title}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{ticket.description.substring(0, 180)}{ticket.description.length > 180 ? "..." : ""}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-fit">
            <div className="rounded-xl bg-background/80 backdrop-blur-sm p-4 text-sm border border-white/10">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Status</p>
              <div className="mt-3"><StatusBadge status={ticket.status} /></div>
            </div>
            <div className="rounded-xl bg-background/80 backdrop-blur-sm p-4 text-sm border border-white/10">
              <p className="text-xs text-muted-foreground font-semibold uppercase">SLA</p>
              <p className="mt-3 font-semibold text-sm">{formatDateTime(ticket.slaDueAt)}</p>
            </div>
            <div className="rounded-xl bg-background/80 backdrop-blur-sm p-4 text-sm border border-white/10">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Responsável</p>
              <p className="mt-3 font-semibold text-sm">{ticket.assignee?.name ?? "Sem responsável"}</p>
            </div>
          </div>
        </div>
      </div>
      <section className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Conversa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {visibleMessages.length > 0 ? (
                  visibleMessages.map((message) => (
                    <div key={message.id} className={`rounded-lg border p-4 ${message.isInternal ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-background/50"}`}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold">{message.author.name}{message.isInternal ? " - 🔒 Interno" : ""}</span>
                        <span>{formatDateTime(message.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{message.body}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground italic">Nenhuma mensagem ainda. Seja o primeiro a comentar.</p>
                  </div>
                )}
              </div>
              <TicketMessageForm
                ticketId={ticket.id}
                canSendInternal={session.role !== Role.CLIENTE}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Equipamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.equipment ? (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-muted-foreground">Máquina:</span>
                    <span className="font-semibold">{ticket.equipment.machineName}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-muted-foreground">Hostname:</span>
                    <span className="font-semibold text-xs">{ticket.equipment.hostname}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-muted-foreground">IP:</span>
                    <span className="font-semibold text-xs">{ticket.equipment.ipAddress}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-muted-foreground">Usuário:</span>
                    <span className="font-semibold">{ticket.equipment.currentUser ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="text-muted-foreground">Sistema:</span>
                    <span className="font-semibold text-xs">{ticket.equipment.operatingSystem}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={ticket.equipment.isOnline ? "success" : "warning"}>{ticket.equipment.isOnline ? "🟢 Online" : "🔴 Offline"}</Badge>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Sem equipamento vinculado</p>
              )}
            </CardContent>
          </Card>

          {ticket.equipment && (
            <RemoteAccessPanel
              ticketId={ticket.id}
              equipmentId={ticket.equipment.id}
              host={ticket.equipment.hostname}
              ip={ticket.equipment.ipAddress}
              sessions={ticket.remoteSessions}
            />
          )}

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sessões Remotas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.remoteSessions.length > 0 ? (
                <div className="space-y-2">
                  {ticket.remoteSessions.map((session) => (
                    <div key={session.id} className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">Sessão #{session.sessionId}</p>
                          <p className="text-xs text-muted-foreground truncate">{session.userName}</p>
                        </div>
                        <Badge variant={session.isActive ? "success" : "warning"} className="flex-shrink-0">{session.isActive ? "Ativa" : "Fim"}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="bg-white/5 px-2 py-1 rounded">{session.mode}</span>
                        <span className="bg-white/5 px-2 py-1 rounded">{session.connectionType}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhuma sessão remota iniciada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-48 overflow-y-auto">
              {ticket.history.map((item, idx) => (
                <div key={item.id} className="border-l-2 border-primary/40 pl-3 pb-2 relative">
                  <div className="absolute -left-2 w-3 h-3 rounded-full bg-primary mt-1"></div>
                  <p className="text-xs font-semibold text-primary uppercase">{item.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{item.actor?.name ?? "Sistema"}</p>
                  {(item.fromValue || item.toValue) && <p className="text-xs text-muted-foreground mt-1">{item.fromValue && <span className="line-through">{item.fromValue}</span>} {item.toValue && <span className="font-semibold text-primary ml-1">→ {item.toValue}</span>}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Avaliação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.rating ? (
                <div className="space-y-3">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className={`h-5 w-5 transition-transform ${index < (ticket.rating?.score ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <p className="text-xs text-muted-foreground italic">{ticket.rating.comment}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="flex gap-1 justify-center mb-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-5 w-5 text-muted-foreground/30" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Aguardando avaliação do cliente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
