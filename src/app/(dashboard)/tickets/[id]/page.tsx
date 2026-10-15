import "reflect-metadata";
import { Info, MessageSquare, History, Smartphone, ShieldCheck, Clock, User, ArrowLeft } from "lucide-react";
import { Role } from "@/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { TicketMessageForm } from "@/components/ticket-message-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeDatabase, getRepository } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { formatDateTime, cn } from "@/lib/utils";
import { Ticket } from "@/entities/Ticket";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketHistory } from "@/entities/TicketHistory";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await initializeDatabase();
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const ticketRepository = getRepository(Ticket);
  const ticket = await ticketRepository.findOne({
    where: {
      id,
      ...(session.role === Role.CLIENTE ? { clienteId: session.id } : {}),
    },
    relations: ["cliente", "responsavel", "category", "equipment", "messages", "messages.author", "history", "history.actor"],
  });

  if (ticket) {
    ticket.messages.sort((a: TicketMessage, b: TicketMessage) => a.createdAt.getTime() - b.createdAt.getTime());
    ticket.history.sort((a: TicketHistory, b: TicketHistory) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  if (!ticket) {
    return <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20"><p className="text-sm font-medium text-muted-foreground">Chamado não encontrado.</p></div>;
  }

  const visibleMessages = ticket.messages.filter(
    (message: TicketMessage) => !message.isInternal || session.role !== Role.CLIENTE
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card px-5 py-5 shadow-sm sm:px-7">
          <Link href="/tickets" className="mt-0.5 rounded-xl border border-border/60 p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">#{ticket.protocolo}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{ticket.titulo}</h1>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{ticket.descricao}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Categoria</p>
                    <p className="text-xs font-semibold">{ticket.category.name}</p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Prioridade</p>
                    <PriorityBadge priority={ticket.prioridade} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Discussão
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                  {visibleMessages.length > 0 ? (
                    visibleMessages.map((message: TicketMessage) => (
                      <div key={message.id} className={cn("space-y-2", message.isInternal && "bg-amber-500/5 p-4 rounded-xl border border-amber-500/10")}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                              {message.author.name.charAt(0)}
                            </div>
                            <span className="text-xs font-bold">{message.author.name}</span>
                            {message.isInternal && <Badge variant="warning" className="text-[8px] h-4">INTERNO</Badge>}
                          </div>
                          <span className="text-[9px] text-muted-foreground font-medium">{formatDateTime(message.createdAt)}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed font-medium pl-8">{message.body}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center opacity-30">
                      <p className="text-xs font-bold uppercase tracking-widest">Sem mensagens</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-border/40">
                  <TicketMessageForm ticketId={ticket.id} canSendInternal={session.role !== Role.CLIENTE} />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="overflow-hidden rounded-3xl border-border/60 bg-card shadow-sm">
              <div className="h-1 w-full bg-primary" />
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <User className="h-3 w-3" /> Solicitante
                    </span>
                    <span className="font-bold">{ticket.cliente.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <Clock className="h-3 w-3" /> SLA
                    </span>
                    <span className="font-bold">{ticket.slaDueAt ? formatDateTime(ticket.slaDueAt).split(',')[0] : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3" /> Responsável
                    </span>
                    <span className="font-bold text-primary">{ticket.responsavel?.name.split(' ')[0] ?? "Pendente"}</span>
                  </div>
                </div>

                {ticket.equipment && (
                  <div className="p-4 rounded-xl bg-muted/30 border border-border/40 space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <Smartphone className="h-3 w-3" /> Equipamento
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold">{ticket.equipment.hostname}</span>
                      <div className={`h-2 w-2 rounded-full ${ticket.equipment.isOnline ? 'bg-emerald-500' : 'bg-muted'} shadow-sm`} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 bg-card shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <History className="h-3 w-3" /> Log de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-4">
                  {ticket.history.slice(-3).map((item: TicketHistory) => (
                    <div key={item.id} className="text-[10px] space-y-1">
                      <div className="flex justify-between font-bold">
                        <span className="text-primary/70">{item.action.replace('_', ' ')}</span>
                        <span className="text-muted-foreground/50">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-muted-foreground uppercase truncate">POR {item.actor?.name.split(' ')[0] ?? "SISTEMA"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
    </div>
  );
}
