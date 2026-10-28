"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { createTicketAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Category = { id: string; name: string };

export function CreateTicketForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(createTicketAction, {});
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state.error]);

  function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.some((file) => !file.type.startsWith("image/"))) {
      toast.error("Selecione apenas arquivos de imagem.");
      event.target.value = "";
      return;
    }
    if (images.length + selected.length > 3) {
      toast.error("É permitido anexar no máximo 3 imagens por chamado.");
      event.target.value = "";
      return;
    }
    const nextImages = [...images, ...selected];
    setImages(nextImages);
    syncInputFiles(nextImages);
  }

  function removeImage(index: number) {
    const nextImages = images.filter((_, currentIndex) => currentIndex !== index);
    setImages(nextImages);
    syncInputFiles(nextImages);
  }

  function syncInputFiles(files: File[]) {
    if (!fileInputRef.current) return;
    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    fileInputRef.current.files = dataTransfer.files;
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">1</span>Conte o que está acontecendo</p>
        <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Resumo do problema</label><Input name="title" placeholder="Ex.: Não consigo acessar o e-mail corporativo" className="h-12 bg-background text-sm" minLength={5} required /></div>
        <div className="mt-4 space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Detalhes</label><Textarea name="description" placeholder="Informe mensagens de erro, quando começou e o que você já tentou fazer." className="min-h-[160px] resize-none bg-background text-sm leading-relaxed" minLength={10} required /></div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">2</span>Anexe imagens (opcional)</p>
        <p className="mb-4 text-xs text-muted-foreground">Até 3 imagens para ajudar a identificar o problema.</p>
        <input ref={fileInputRef} name="images" type="file" accept="image/*" multiple className="sr-only" onChange={handleImagesChange} />
        <Button type="button" variant="outline" className="h-11" onClick={() => fileInputRef.current?.click()} disabled={images.length >= 3}>
          <ImagePlus className="h-4 w-4" /> Selecionar imagens ({images.length}/3)
        </Button>
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {images.map((image, index) => (
              <div key={`${image.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-border/60 bg-background p-2 text-xs">
                <ImagePlus className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate" title={image.name}>{image.name}</span>
                <button type="button" onClick={() => removeImage(index)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label={`Remover ${image.name}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
        <p className="mb-4 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">3</span>Classifique sua solicitação</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Área afetada</label><Select name="categoryId" required className="h-12 bg-background text-sm"><option value="" disabled>Selecione uma categoria</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></div>
          <div className="space-y-2"><label className="ml-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Urgência</label><Select name="priority" defaultValue="MEDIA" className="h-12 bg-background text-sm"><option value="BAIXA">Baixa — Rotina</option><option value="MEDIA">Média — Importante</option><option value="ALTA">Alta — Urgente</option><option value="CRITICA">Crítica — Impedimento total</option></Select></div>
        </div>
      </div>

      <Button className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]"><Send className="h-4 w-4" /> Enviar chamado</Button>
    </form>
  );
}
