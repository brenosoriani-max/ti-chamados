"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, SendToBack, X } from "lucide-react";
import { finishTicketAction, transferTicketAction } from "@/app/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function TicketFinishDialog({
  open,
  onClose,
  ticketId,
  defaultValue = "",
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  defaultValue?: string;
  onSuccess?: () => void;
}) {
  const [conclusion, setConclusion] = useState(defaultValue);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) setConclusion(defaultValue);
  }, [open, defaultValue]);

  if (!open) return null;

  async function handleFinish() {
    const value = conclusion.trim();
    if (value.length < 10) {
      toast.error("Informe pelo menos 10 caracteres na conclusão do atendimento.");
      return;
    }
    setIsPending(true);
    try {
      await finishTicketAction(ticketId, value);
      toast.success("Atendimento finalizado com sucesso.");
      onSuccess?.();
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível finalizar o atendimento.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Finalizar atendimento</p>
            <h3 className="mt-2 text-xl font-black">Resumo da solução</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-border p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={conclusion}
          onChange={(event) => setConclusion(event.target.value)}
          rows={6}
          placeholder="Descreva em poucas linhas o que foi feito, diagnóstico, correção e validação do atendimento."
          className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm outline-none ring-0 focus:border-primary"
        />

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleFinish} disabled={isPending} className="gap-2">
            {isPending ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TicketTransferDialog({
  open,
  onClose,
  ticketId,
  techList,
  defaultToUserId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  ticketId: string;
  techList: Array<{ id: string; name: string }>;
  defaultToUserId?: string;
  onSuccess?: () => void;
}) {
  const [toUserId, setToUserId] = useState(defaultToUserId || techList[0]?.id || "");
  const [reason, setReason] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open && techList.length > 0) {
      setToUserId(defaultToUserId || techList[0].id);
      setReason("");
    }
  }, [open, techList, defaultToUserId]);

  if (!open) return null;

  async function handleTransfer() {
    const value = reason.trim();
    if (!toUserId || value.length < 3) {
      toast.error("Selecione o técnico e informe o motivo da transferência.");
      return;
    }
    setIsPending(true);
    try {
      await transferTicketAction(ticketId, toUserId, value);
      toast.success("Chamado transferido com sucesso.");
      onSuccess?.();
      onClose();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível transferir o chamado.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transferência</p>
            <h3 className="mt-2 text-xl font-black">Encaminhar chamado</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-border p-2 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Técnico responsável</label>
            <select
              value={toUserId}
              onChange={(event) => setToUserId(event.target.value)}
              className="h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            >
              {techList.map((tech) => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Motivo da transferência</label>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Ex.: necessidade de especialista em rede / backlog da equipe / troca por escala..."
              className="w-full resize-none rounded-2xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleTransfer} disabled={isPending} className="gap-2">
            {isPending ? (
              <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            ) : (
              <SendToBack className="h-4 w-4" />
            )}
            Transferir
          </Button>
        </div>
      </div>
    </div>
  );
}
