"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveTicketAction, deleteTicketAction } from "@/app/actions";
import { useRouter } from "next/navigation";

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
      } catch (error) {
        console.error("Erro ao alterar status de arquivamento:", error);
      }
    });
  }

  function handleDelete() {
    if (!window.confirm("Tem certeza que deseja excluir permanentemente este chamado?")) return;
    
    startTransition(async () => {
      try {
        await deleteTicketAction(ticketId);
        router.refresh();
      } catch (error) {
        console.error("Erro ao excluir chamado:", error);
      }
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
