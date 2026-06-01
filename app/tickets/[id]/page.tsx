import { Paperclip, Send, Star } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { RemoteAccessPanel } from "@/components/remote-access-panel";
import { Button } from "@/components/ui/button";
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
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{ticket.number}</p>
          <h1 className="mt-1 text-2xl font-semibold">{ticket.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{ticket.category.name}</span>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Cliente: {ticket.customer.name}</p>
          <p>Tecnico: {ticket.assignee?.name ?? "Sem responsavel"}</p>
          <p>SLA: {formatDateTime(ticket.slaDueAt)}</p>
        </div>
      </div>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
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
