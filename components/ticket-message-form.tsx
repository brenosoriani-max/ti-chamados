"use client";

import { Send, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TicketMessageFormProps {
  ticketId: string;
  canSendInternal?: boolean;
}

export function TicketMessageForm({ ticketId, canSendInternal = false }: TicketMessageFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      if (!message.trim()) {
        setError("Mensagem não pode estar vazia");
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          body: message.trim(),
          isInternal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }

      setMessage("");
      setSuccess(true);
      setIsInternal(false);
      
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4 border-t border-white/10 pt-4">
      <div className="space-y-3">
        <Textarea
          placeholder="Escrever resposta..."
          className="resize-none min-h-24"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
          required
        />
        
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-3 py-2">
            ✓ Mensagem enviada com sucesso
          </div>
        )}

        {canSendInternal && (
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              disabled={isLoading}
              className="rounded"
            />
            <span className="text-muted-foreground">🔒 Comentário interno (só técnicos veem)</span>
          </label>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="sm" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
