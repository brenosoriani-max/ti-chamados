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

      if (!message.trim()) {3
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
    <form onSubmit={handleSubmit} ref={formRef} className="space-y-4 pt-6 border-t border-white/5">
      <div className="space-y-4">
        <div className="relative group">
          <Textarea
            placeholder="Escrever resposta..."
            className="group-focus-within:ring-primary/20 transition-all duration-300 shadow-inner min-h-[160px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
            required
          />
          <div className="absolute bottom-3 right-3 pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
            <Send className="h-4 w-4 text-primary" />
          </div>
        </div>
        
        {error && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-400/5 border border-red-400/10 rounded-xl px-4 py-3">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/5 border border-emerald-400/10 rounded-xl px-4 py-3">
            ✓ Mensagem enviada com sucesso
          </div>
        )}

        {canSendInternal && (
          <div className={`flex items-center justify-between rounded-2xl border transition-all duration-300 p-4 ${isInternal ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5 bg-white/5'}`}>
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center transition-colors ${isInternal ? 'bg-amber-500/20 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                {isInternal ? '🔒' : '🌐'}
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-bold ${isInternal ? 'text-amber-500' : 'text-foreground'}`}>Comentário interno</span>
                <span className="text-[10px] text-muted-foreground font-medium">Visível apenas para a equipe técnica</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              disabled={isLoading}
              className="h-5 w-5 rounded-lg border-white/10 bg-black/20 text-primary focus:ring-primary/50 cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] text-muted-foreground font-medium italic">Shift + Enter para enviar rapidamente</p>
        <Button type="submit" disabled={isLoading} className="rounded-full px-8 premium-gradient shadow-xl shadow-teal-500/10 hover:scale-105 active:scale-95 transition-all gap-2">
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
