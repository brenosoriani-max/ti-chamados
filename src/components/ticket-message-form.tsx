"use client";

import { Send, Loader2, Paperclip, X, Sparkles, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { messages } from "@/lib/messages";

interface TicketMessageFormProps {
  ticketId: string;
  canSendInternal?: boolean;
  disabled?: boolean;
  onMessageSent?: (payload: {
    id: string;
    body: string;
    isInternal: boolean;
    createdAt: string;
    attachments?: Array<{ id: string; fileName: string; fileUrl: string; fileType?: string | null; fileSize?: number | null }>;

    author: { id: string; name: string; avatarUrl?: string | null };
  }) => void;
  onTypingChange?: (isTyping: boolean) => void;
}

export function TicketMessageForm({
  ticketId,
  canSendInternal = false,
  disabled = false,
  onMessageSent,
  onTypingChange,
}: TicketMessageFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [knowledgeQuickInsert, setKnowledgeQuickInsert] = useState<{ title: string; content: string } | null>(null);

  const isFormDisabled = disabled || isLoading;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ title?: string; content?: string }>;
      const detail = customEvent.detail ?? {};
      if (!detail.content) return;
      setKnowledgeQuickInsert({
        title: detail.title ?? "Resposta sugerida",
        content: detail.content,
      });
      setMessage(detail.content);
    };

    window.addEventListener("ti:insert-knowledge", handler);
    return () => window.removeEventListener("ti:insert-knowledge", handler);
  }, []);

  async function handleSubmit(e?: React.FormEvent<HTMLFormElement>) {
    e?.preventDefault();

    if (isFormDisabled) return;

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const normalizedMessage = message.trim();
      if (!normalizedMessage && selectedFiles.length === 0) {
        const validationError = messages.tickets.invalidComment;
        setError(validationError);
        toast.error(validationError);
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("body", normalizedMessage);
      formData.append("isInternal", String(isInternal));
      selectedFiles.forEach((file) => formData.append("images", file));

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const failMessage = errorData.error || messages.tickets.commentError;
        throw new Error(failMessage);
      }

      const payload = await response.json();
      setMessage("");
      setSelectedFiles([]);
      if (formRef.current) {
        formRef.current.reset();
      }
      setSuccess(true);
      setIsInternal(false);
      onTypingChange?.(false);
      onMessageSent?.(payload);
      toast.success("Mensagem enviada com sucesso.");

      setTimeout(() => {
        setSuccess(false);
      }, 1200);
    } catch (err) {
      const failMessage = err instanceof Error ? err.message : messages.tickets.commentError;
      setError(failMessage);
      toast.error(failMessage);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilesSelected(files: FileList | null) {
    const nextFiles = Array.from(files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 3);

    if (nextFiles.length === 0) {
      setSelectedFiles([]);
      return;
    }

    setSelectedFiles(nextFiles);
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4 border-t border-border/60 pt-6">
      <div className="space-y-4">
        <div className="relative group">
          <Textarea
            placeholder={disabled ? "Este chamado foi finalizado e o chat está bloqueado." : "Escrever resposta..."}
            className="min-h-[140px] rounded-xl border-border/60 bg-background shadow-inner transition-all duration-300 group-focus-within:ring-primary/20"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (!disabled) {
                onTypingChange?.(e.target.value.trim().length > 0);
              }
            }}
            onBlur={() => onTypingChange?.(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.shiftKey) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            disabled={isFormDisabled}
            required={selectedFiles.length === 0}
          />
          <div className="absolute bottom-3 right-3 pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
            <Send className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"}`}>
            <Paperclip className="h-3 w-3" />
            Anexar imagem
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={disabled}
              onChange={(event) => handleFilesSelected(event.target.files)}
            />
          </label>

          <span className="text-[10px] text-muted-foreground">
            {selectedFiles.length > 0 ? `${selectedFiles.length} imagem(ns) selecionada(s)` : "Sem anexos"}
          </span>
        </div>

        {selectedFiles.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="aspect-video w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute right-1.5 top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm"
                  onClick={() => setSelectedFiles((current) => current.filter((_, idx) => idx !== index))}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-400/10 bg-red-400/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            ✓ Mensagem enviada com sucesso
          </div>
        )}

        {canSendInternal && (
          <div className={`flex items-center justify-between rounded-xl border p-4 transition-all duration-300 ${isInternal ? "border-amber-500/30 bg-amber-500/5" : "border-border/60 bg-muted/30"}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${isInternal ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                {isInternal ? "🔒" : "🌐"}
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isInternal ? "text-amber-500" : "text-foreground"}`}>Comentário interno</span>
                <span className="text-[10px] font-medium text-muted-foreground">Visível apenas para a equipe técnica</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              disabled={isFormDisabled}
              className="h-5 w-5 cursor-pointer rounded-lg border-white/10 bg-black/20 text-primary focus:ring-primary/50"
            />
          </div>
        )}

        {knowledgeQuickInsert && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-left">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="h-3 w-3" />
                Resposta sugerida
              </div>
              <button
                type="button"
                onClick={() => setKnowledgeQuickInsert(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar resposta sugerida"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs font-semibold text-foreground">{knowledgeQuickInsert.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
              {knowledgeQuickInsert.content}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-medium italic text-muted-foreground">Shift + Enter para enviar rapidamente</p>
        <Button type="submit" disabled={isFormDisabled} className="h-10 rounded-xl px-5 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-tighter">Enviar Mensagem</span>
              <Send className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
