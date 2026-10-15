"use client";

import { useActionState, useEffect } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { createTicketAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: string; name: string };

export function CreateTicketForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createTicketAction, {});

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">1</span>Conte o que está acontecendo</p>
        <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Resumo do problema</label><Input name="title" placeholder="Ex.: Não consigo acessar o e-mail corporativo" className="h-12 bg-background text-sm" minLength={5} required /></div>
        <div className="mt-4 space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Detalhes</label><Textarea name="description" placeholder="Informe mensagens de erro, quando começou e o que você já tentou fazer." className="min-h-[160px] resize-none bg-background text-sm leading-relaxed" minLength={10} required /></div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">2</span>Classifique sua solicitação</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Área afetada</label><Select name="categoryId" required className="h-12 bg-background text-sm"><option value="" disabled>Selecione uma categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>
          <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Urgência</label><Select name="priority" defaultValue="MEDIA" className="h-12 bg-background text-sm"><option value="BAIXA">Baixa — Rotina</option><option value="MEDIA">Média — Importante</option><option value="ALTA">Alta — Urgente</option><option value="CRITICA">Crítica — Impedimento total</option></Select></div>
        </div>
      </div>

      <Button className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"><Send className="h-4 w-4" /> Enviar chamado</Button>
    </form>
  );
}
