import { Paperclip, Send, Star } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { RemoteAccessPanel } from "@/components/remote-access-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
    return <AppShell><p>Chamado nao encontrado.</p></AppShell>;
  }

  const visibleMessages = ticket.messages.filter((message) => !message.isInternal || session.role !== Role.CLIENTE);

  return (
    <AppShell>
      <div className="mb-6 rounded-3xl border border-primary/10 bg-primary/5 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{ticket.number}</p>
            <h1 className="mt-1 text-3xl font-semibold">{ticket.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{ticket.description.substring(0, 180)}{ticket.description.length > 180 ? "..." : ""}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl bg-background p-4 text-sm shadow-sm">
              <p className="text-muted-foreground">Status</p>
              <div className="mt-2"><StatusBadge status={ticket.status} /></div>
            </div>
            <div className="rounded-2xl bg-background p-4 text-sm shadow-sm">
              <p className="text-muted-foreground">SLA</p>
              <p className="mt-2 font-semibold">{formatDateTime(ticket.slaDueAt)}</p>
            </div>
            <div className="rounded-2xl bg-background p-4 text-sm shadow-sm">
              <p className="text-muted-foreground">Responsavel</p>
              <p className="mt-2 font-semibold">{ticket.assignee?.name ?? "Sem responsavel"}</p>
            </div>
          </div>
        </div>
      </div>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Conversa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {visibleMessages.map((message) => (
                <div key={message.id} className={`rounded-lg border p-4 ${message.isInternal ? "border-amber-500/30 bg-amber-500/10" : "bg-background"}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span>{message.author.name}{message.isInternal ? " - interno" : ""}</span>
                    <span>{formatDateTime(message.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-6">{message.body}</p>
                </div>
              ))}
              <form className="space-y-3">
                <Textarea placeholder="Responder chamado" />
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline"><Paperclip className="h-4 w-4" /> Anexar</Button>
                  <Button type="button"><Send className="h-4 w-4" /> Enviar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Equipamento vinculado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ticket.equipment ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>Maquina: {ticket.equipment.machineName}</p>
                  <p>Hostname: {ticket.equipment.hostname}</p>
                  <p>IP: {ticket.equipment.ipAddress}</p>
                  <p>Usuario: {ticket.equipment.currentUser ?? "N/A"}</p>
                  <p>Sistema: {ticket.equipment.operatingSystem}</p>
                  <p>Status: {ticket.equipment.isOnline ? "Online" : "Offline"}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum equipamento vinculado a este chamado.</p>
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
            <CardHeader><CardTitle>Sessões remotas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ticket.remoteSessions.length > 0 ? (
                <div className="space-y-3">
                  {ticket.remoteSessions.map((session) => (
                    <div key={session.id} className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">Sessão {session.sessionId}</p>
                          <p className="text-xs text-muted-foreground">{session.userName} • {session.connectionType}</p>
                        </div>
                        <Badge variant={session.isActive ? "success" : "warning"}>{session.isActive ? "Ativa" : "Concluída"}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{session.mode}</span>
                        <span>{session.startedAt ? `Início ${formatDateTime(session.startedAt)}` : "Aguardando início"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Quando o técnico solicitar uma sessão remota, ela aparecerá aqui.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ticket.history.map((item) => (
                <div key={item.id} className="border-l pl-4">
                  <p className="text-sm font-medium">{item.action.replaceAll("_", " ")}</p>
                  <p className="text-xs text-muted-foreground">{item.actor?.name ?? "Sistema"} - {formatDateTime(item.createdAt)}</p>
                  {(item.fromValue || item.toValue) && <p className="mt-1 text-xs text-muted-foreground">{item.fromValue ?? ""} {item.toValue ? `-> ${item.toValue}` : ""}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Avaliacao</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-1 text-amber-300">
                {Array.from({ length: 5 }).map((_, index) => <Star key={index} className={`h-5 w-5 ${ticket.rating && index < ticket.rating.score ? "fill-current" : ""}`} />)}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{ticket.rating?.comment ?? "Sem avaliacao registrada."}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
