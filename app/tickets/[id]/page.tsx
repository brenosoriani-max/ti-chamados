import { Info, MessageSquare, History, Smartphone, Star, ShieldCheck, Clock, User, ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { RemoteAccessPanel } from "@/components/remote-access-panel";
import { RemoteAccessControl } from "@/components/remote-access-control";
import { TicketMessageForm } from "@/components/ticket-message-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDateTime, cn } from "@/lib/utils";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, ...(session.role === Role.CLIENTE ? { customerId: session.id } : {}) },
    select: {
      id: true, number: true, title: true, description: true, status: true, priority: true, slaDueAt: true, customerId: true,
      customer: { select: { name: true } },
      assignee: { select: { name: true } },
      category: { select: { name: true } },
      equipment: { select: { id: true, hostname: true, ipAddress: true, isOnline: true } },
      remoteSessions: { 
        select: { id: true, sessionId: true, userName: true, status: true, connectionType: true, mode: true, isActive: true, createdAt: true, updatedAt: true }, 
        orderBy: { createdAt: "desc" } 
      },
      rating: { select: { score: true, comment: true } },
      messages: { 
        select: { id: true, body: true, isInternal: true, createdAt: true, author: { select: { name: true } } }, 
        orderBy: { createdAt: "asc" } 
      },
      history: { 
        select: { id: true, action: true, createdAt: true, actor: { select: { name: true } } }, 
        orderBy: { createdAt: "asc" } 
      }
    }
  });

  if (!ticket) {
    return <AppShell><div className="flex flex-col items-center justify-center py-20"><p className="text-muted-foreground">Chamado não encontrado.</p></div></AppShell>;
  }

  const visibleMessages = ticket.messages.filter((message) => !message.isInternal || session.role !== Role.CLIENTE);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/tickets" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">#{ticket.number}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{ticket.title}</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Descrição
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Categoria</p>
                    <p className="text-xs font-semibold">{ticket.category.name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Prioridade</p>
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Discussão
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                  {visibleMessages.length > 0 ? (
                    visibleMessages.map((message) => (
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
            <Card className="border-none shadow-sm bg-card/50 overflow-hidden">
              <div className="h-1 w-full bg-primary" />
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <User className="h-3 w-3" /> Solicitante
                    </span>
                    <span className="font-bold">{ticket.customer.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <Clock className="h-3 w-3" /> SLA
                    </span>
                    <span className="font-bold">{formatDateTime(ticket.slaDueAt).split(',')[0]}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-2 border-b border-border/30">
                    <span className="text-muted-foreground font-medium flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3" /> Responsável
                    </span>
                    <span className="font-bold text-primary">{ticket.assignee?.name.split(' ')[0] ?? "Pendente"}</span>
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
                    <div className="pt-3 border-t border-border/30">
                        <RemoteAccessControl 
                          ticketId={ticket.id}
                          equipmentId={ticket.equipment.id}
                          hostname={ticket.equipment.hostname}
                          ipAddress={ticket.equipment.ipAddress}
                        />
                    </div>
                  </div>
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

            <Card className="border-none shadow-sm bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
                  <History className="h-3 w-3" /> Log de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="space-y-4">
                  {ticket.history.slice(-3).map((item) => (
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
    </AppShell>
  );
}
