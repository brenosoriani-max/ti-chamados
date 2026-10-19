"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import { TicketMessageForm } from "@/components/ticket-message-form";
import { formatDateTime, cn } from "@/lib/utils";
import { Role } from "@/types";

type TicketMessagePayload = {
  id: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; name: string; avatarUrl?: string | null };
};

type TypingPayload = {
  ticketId: string;
  userName: string;
  isTyping: boolean;
};

interface TicketDiscussionProps {
  ticketId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatarUrl?: string | null;
  initialMessages: TicketMessagePayload[];
  canSendInternal?: boolean;
  userRole: Role;
}

export function TicketDiscussion({
  ticketId,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  initialMessages,
  canSendInternal = false,
  userRole,
}: TicketDiscussionProps) {
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const storageKey = `ticket:read:${ticketId}:${currentUserId}`;
  const unreadFlagKey = `ticket:unread:${ticketId}:${currentUserId}`;
  const [messages, setMessages] = useState<TicketMessagePayload[]>(() =>
    [...initialMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  );
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [readMessageIds, setReadMessageIds] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [persistedReadIds, setPersistedReadIds] = useState<string[]>([]);

  const lastOwnMessageId = useMemo(
    () => [...messages].reverse().find((message) => message.author.id === currentUserId)?.id,
    [messages, currentUserId]
  );

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(readMessageIds));
  }, [readMessageIds, storageKey]);

  useEffect(() => {
    const unreadIds = messages
      .filter(
        (message) => message.author.id !== currentUserId && !readMessageIds.includes(message.id)
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    const timeoutId = window.setTimeout(() => {
      setReadMessageIds((current) => {
        const next = Array.from(new Set([...current, ...unreadIds]));
        return next;
      });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [messages, currentUserId, readMessageIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasUnreadMessages = messages.some(
      (message) => message.author.id !== currentUserId && !readMessageIds.includes(message.id)
    );

    if (hasUnreadMessages) {
      window.localStorage.setItem(unreadFlagKey, "true");
      return;
    }

    window.localStorage.setItem(unreadFlagKey, "false");
  }, [messages, currentUserId, readMessageIds, unreadFlagKey]);

  // Persist newly-read message ids to the server
  useEffect(() => {
    const newlyRead = readMessageIds.filter((id) => !persistedReadIds.includes(id));
    if (newlyRead.length === 0) return;

    const controller = new AbortController();

    (async () => {
      try {
        await fetch(`/api/tickets/${ticketId}/reads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageIds: newlyRead }),
          signal: controller.signal,
        });

        setPersistedReadIds((current) => Array.from(new Set([...current, ...newlyRead])));
      } catch {
        // ignore network errors, we'll retry on next change
      }
    })();

    return () => controller.abort();
  }, [readMessageIds, persistedReadIds, ticketId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasUnreadMessages = messages.some(
      (message) => message.author.id !== currentUserId && !readMessageIds.includes(message.id)
    );

    if (!hasUnreadMessages) {
      window.localStorage.setItem(unreadFlagKey, "false");
    }
  }, [messages, currentUserId, readMessageIds, unreadFlagKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unreadIds = messages
      .filter(
        (message) => message.author.id !== currentUserId && !readMessageIds.includes(message.id)
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) {
      window.localStorage.setItem(unreadFlagKey, "false");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setReadMessageIds((current) => {
        const next = Array.from(new Set([...current, ...unreadIds]));
        return next;
      });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [messages, currentUserId, readMessageIds, unreadFlagKey]);

  const unreadMessageIds = useMemo(
    () =>
      new Set(
        messages
          .filter((message) => message.author.id !== currentUserId)
          .filter((message) => !readMessageIds.includes(message.id))
          .map((message) => message.id)
      ),
    [messages, currentUserId, readMessageIds]
  );

  useEffect(() => {
    const socket = io({ transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-ticket", ticketId);
    });

    socket.on("ticket:message", (payload: TicketMessagePayload) => {
      if (payload.isInternal && userRole === Role.CLIENTE) {
        return;
      }

      if (payload.author.id !== currentUserId) {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(`ticket:unread:${ticketId}:${currentUserId}`, "true");
        }
      }

      setMessages((current) => {
        if (current.some((message) => message.id === payload.id)) {
          return current;
        }

        const next = [...current, payload].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        return next;
      });
    });

    socket.on("ticket:typing", (payload: TypingPayload) => {
      if (payload.ticketId !== ticketId || payload.userName === currentUserName) {
        return;
      }

      setTypingUsers((current) => {
        if (payload.isTyping) {
          const next = current.includes(payload.userName) ? current : [...current, payload.userName];
          return next;
        }

        return current.filter((name) => name !== payload.userName);
      });
    });

    return () => {
      socket.emit("leave-ticket", ticketId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ticketId, currentUserName, userRole, currentUserId]);

  function handleMessageSent(payload: TicketMessagePayload) {
    if (payload.isInternal && userRole === Role.CLIENTE) {
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(`ticket:unread:${ticketId}:${currentUserId}`, "false");
    }

    setMessages((current) => {
      if (current.some((message) => message.id === payload.id)) {
        return current;
      }

      const next = [...current, payload].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return next;
    });
  }

  function handleTypingChange(isTyping: boolean) {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit("ticket:typing", {
      ticketId,
      userName: currentUserName,
      isTyping,
    });
  }

  const renderAvatar = (author: TicketMessagePayload["author"], isCurrentUser = false) => {
    if (author.avatarUrl) {
      return (
        <img
          src={author.avatarUrl}
          alt={author.name}
          className={cn(
            "h-7 w-7 rounded-full object-cover border",
            isCurrentUser ? "border-primary/30" : "border-border/40"
          )}
        />
      );
    }

    return (
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold",
          isCurrentUser ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
        )}
      >
        {author.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div ref={scrollRef} className="space-y-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
        {messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.author.id === currentUserId;
            const isUnread = message.author.id !== currentUserId && unreadMessageIds.has(message.id);
            const isReadByMe = message.author.id !== currentUserId && !isUnread && readMessageIds.includes(message.id);
            const isLastOwnMessage = message.id === lastOwnMessageId;

            return (
              <div
                key={message.id}
                className={cn(
                  "space-y-2 rounded-2xl border p-4 transition-colors",
                  message.isInternal
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-border/40 bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {renderAvatar(message.author, isCurrentUser)}
                    <span className="text-xs font-bold">{message.author.name}</span>
                    {message.isInternal && (
                      <Badge variant="warning" className="h-4 text-[8px]">
                        INTERNO
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <Badge className="h-5 border border-blue-500/30 bg-blue-500/10 px-2 text-[9px] font-bold text-blue-600 dark:text-blue-300">
                        NOVA
                      </Badge>
                    )}
                    {isCurrentUser && isLastOwnMessage && (
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        {isReadByMe ? "Lida" : "Enviada"}
                      </span>
                    )}
                    {!isCurrentUser && isReadByMe && (
                      <span className="text-[9px] font-semibold text-muted-foreground">
                        Lida
                      </span>
                    )}
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {formatDateTime(new Date(message.createdAt))}
                    </span>
                  </div>
                </div>
                <p className={cn(
                  "pl-9 text-xs font-medium leading-relaxed",
                  message.isInternal ? "text-amber-700 dark:text-amber-300" : "text-foreground/80"
                )}>
                  {message.body}
                </p>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center opacity-30">
            <p className="text-xs font-bold uppercase tracking-widest">Sem mensagens</p>
          </div>
        )}

        {typingUsers.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-[10px] font-medium text-primary">
            {typingUsers.join(", ")} está digitando...
          </div>
        )}
      </div>

      <div className="border-t border-border/40 pt-4">
        <TicketMessageForm
          ticketId={ticketId}
          canSendInternal={canSendInternal}
          onMessageSent={handleMessageSent}
          onTypingChange={handleTypingChange}
        />
      </div>
    </div>
  );
}
