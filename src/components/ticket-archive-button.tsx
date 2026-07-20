"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveTicketAction, deleteTicketAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface TicketArchiveButtonProps {
  ticketId: string;
  isArchived: boolean;
}

export function TicketArchiveButton({ ticketId, isArchived }: TicketArchiveButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleArchive() {
    startTransition(async () => {
      try {
        await archiveTicketAction(ticketId, !isArchived);
        router.refresh();
        toast.success(isArchived ? "Chamado restaurado com sucesso." : "Chamado arquivado com sucesso.");
      } catch (error) {
        console.error("Erro ao alterar status de arquivamento:", error);
        toast.error("Não foi possível atualizar o chamado. Tente novamente.");
      }
    });
  }

  function deleteTicket() {
    startTransition(async () => {
      try {
        await deleteTicketAction(ticketId);
        toast.success("Chamado excluído permanentemente.");
        router.refresh();
      } catch (error) {
        console.error("Erro ao excluir chamado:", error);
        toast.error("Não foi possível excluir o chamado. Tente novamente.");
      }
    });
  }

  function handleDelete() {
    toast.warning("Excluir chamado permanentemente?", {
      description: "Essa ação não pode ser desfeita.",
      duration: 10_000,
      action: { label: "Excluir", onClick: deleteTicket },
      cancel: { label: "Cancelar", onClick: () => undefined },
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        title={isArchived ? "Restaurar chamado" : "Arquivar chamado"}
        className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
        onClick={handleArchive}
      >
        {isArchived ? (
          <ArchiveRestore className="h-4 w-4" />
        ) : (
          <Archive className="h-4 w-4" />
        )}
      </Button>
      
      {isArchived && (
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          title="Excluir permanentemente"
          className="h-8 w-8 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-colors"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
