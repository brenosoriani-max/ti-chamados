import "reflect-metadata";
import { Info, MessageSquare, History, Smartphone, ShieldCheck, Clock, UserRound as UserIcon, ArrowLeft, ImageIcon, RefreshCcw, CheckCircle2, SendToBack } from "lucide-react";
import { Role, TicketStatus } from "@/types";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initializeDatabase, getRepository } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/utils";
import { Ticket } from "@/entities/Ticket";
import { User as UserEntity } from "@/entities/User";
import { TicketMessage } from "@/entities/TicketMessage";
import { TicketHistory } from "@/entities/TicketHistory";
import { TicketDiscussion } from "@/components/ticket-discussion";
import { TicketReopenButton } from "@/components/ticket-reopen-button";
import { TicketDetailActions } from "@/components/ticket-detail-actions";
import { RelatedKnowledge } from "@/components/related-knowledge";
import { findRelatedKnowledgeArticles } from "@/lib/knowledge";
import { In } from "typeorm";

function formatHistoryBlock(date: Date) {
  const today = new Date();
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffDays = Math.round((normalizedToday.getTime() - normalizedDate.getTime()) / 86400000);

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date);
}

const isTicketClosed = (status: TicketStatus) =>
  [TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO].includes(status);

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
    relations: ["cliente", "responsavel", "category", "equipment", "attachments", "messages", "messages.author", "history", "history.actor"],
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

  const chatBlocked = isTicketClosed(ticket.status);
  const canManageTicket = session.role === Role.TECNICO || session.role === Role.ADMIN;
  const showKnowledge = canManageTicket && !chatBlocked;

  const [techList, relatedArticles] = await Promise.all([
    getRepository(UserEntity)
      .find({
        where: { role: In([Role.TECNICO, Role.ADMIN]) },
        select: ["id", "name"],
        order: { name: "ASC" },
      })
      .then((users) => users.map(({ id, name }) => ({ id, name }))) as Promise<Array<{ id: string; name: string }>>,
    // só busca os artigos se eles realmente serão exibidos
    showKnowledge
      ? findRelatedKnowledgeArticles({
          title: ticket.titulo,
          description: ticket.descricao,
          categoryId: ticket.categoryId,
          limit: 4,
        })
      : Promise.resolve([]),
  ]);

  // Serialização para o Client Component (evita o erro "Only plain objects...")
  const relatedArticlesDto = relatedArticles.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    tags: a.tags ?? null,
    attachmentName: a.attachmentName ?? null,
    attachmentUrl: a.attachmentUrl ?? null,
    isQuickReply: Boolean(a.isQuickReply),
    category: a.category ? { name: a.category.name } : null,
  }));

  const historyByDay = ticket.history.reduce<Record<string, TicketHistory[]>>((acc, item) => {
    const label = formatHistoryBlock(new Date(item.createdAt));
    acc[label] = acc[label] ? [...acc[label], item] : [item];
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card px-5 py-5 shadow-sm sm:px-7">
        <Link href="/tickets" className="mt-0.5 rounded-xl border border-border/60 p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">#{ticket.protocolo}</span>
            <StatusBadge status={ticket.status} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{ticket.titulo}</h1>
          {canManageTicket && !chatBlocked && (
            <TicketDetailActions
              ticketId={ticket.id}
              ticketStatus={ticket.status}
              techList={techList}
              canManage={canManageTicket}
            />
          )}
        </div>
        {chatBlocked && (
          <TicketReopenButton ticketId={ticket.id} />
        )}
      </header>

      {chatBlocked && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            <span className="font-medium">Este chamado foi finalizado. Para continuar a conversa, reabra o atendimento.</span>
          </div>
        </div>
      )}

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

          {ticket.conclusaoAtendimento && (
            <Card className="overflow-hidden rounded-3xl border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <CardHeader className="border-b border-emerald-500/10 pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Conclusão do atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">{ticket.conclusaoAtendimento}</p>
                {ticket.resolvedAt && (
                  <p className="mt-4 text-[11px] font-medium text-muted-foreground">
                    Finalizado em {formatDateTime(ticket.resolvedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {ticket.transferReason && (
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <SendToBack className="h-3 w-3" />
                Última transferência
              </div>
              <p className="text-foreground/80">{ticket.transferReason}</p>
            </div>
          )}

          {ticket.attachments.length > 0 && (
            <Card className="overflow-hidden rounded-3xl border-border/60 bg-card shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-bold">
                  <ImageIcon className="h-4 w-4 text-primary" /> Imagens anexadas
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2">
                {ticket.attachments.map((attachment) => (
                  <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                    <img src={attachment.fileUrl} alt={attachment.fileName} className="aspect-video w-full object-cover transition-transform group-hover:scale-105" />
                    <p className="truncate px-3 py-2 text-xs font-medium" title={attachment.fileName}>{attachment.fileName}</p>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden rounded-3xl border-border/60 bg-card shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Discussão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Respostas rápidas na área do chat (somente técnico/admin, chamado aberto) */}
             

              <TicketDiscussion
                ticketId={ticket.id}
                currentUserId={session.id}
                currentUserName={session.name}
                currentUserAvatarUrl={undefined}
                initialMessages={visibleMessages.map((message: TicketMessage) => ({
                  id: message.id,
                  body: message.body,
                  isInternal: message.isInternal,
                  createdAt: message.createdAt.toISOString(),
                  attachments: (message.attachments ?? []).map((attachment) => ({
                    id: attachment.id,
                    fileName: attachment.fileName,
                    fileUrl: attachment.fileUrl,
                    fileType: attachment.fileType ?? null,
                    fileSize: attachment.fileSize ?? null,
                  })),
                  author: {
                    id: message.author.id,
                    name: message.author.name,
                    avatarUrl: message.author.avatarUrl ?? null,
                  },
                }))}
                canSendInternal={session.role !== Role.CLIENTE}
                userRole={session.role}
                isChatBlocked={chatBlocked}
              />

               {showKnowledge && relatedArticlesDto.length > 0 && (
                <RelatedKnowledge articles={relatedArticlesDto} compact />
              )}  
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
                    <UserIcon className="h-3 w-3" /> Solicitante
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
                {Object.entries(historyByDay)
                  .slice(-3)
                  .map(([label, items]) => (
                    <div key={label} className="space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
                      <div className="space-y-3">
                        {items.slice(-3).map((item: TicketHistory) => (
                          <div key={item.id} className="text-[10px] space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-primary/70">{item.action.replace('_', ' ')}</span>
                              <span className="text-muted-foreground/50">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-muted-foreground uppercase truncate">POR {item.actor?.name.split(' ')[0] ?? "SISTEMA"}</p>
                            {item.toValue && <p className="text-muted-foreground truncate">{item.toValue}</p>}
                          </div>
                        ))}
                      </div>
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