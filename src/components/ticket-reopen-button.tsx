"use client";

import { useTransition } from "react";
import { RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { reopenTicketAction } from "@/app/actions";

export function TicketReopenButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleReopen() {
    startTransition(async () => {
      try {
        await reopenTicketAction(ticketId);
        router.refresh();
        toast.success("Chamado reaberto com sucesso.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível reabrir o chamado.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      className="gap-2 rounded-xl border-amber-300 bg-amber-500/5 text-amber-700 hover:bg-amber-500/10 dark:border-amber-700 dark:text-amber-200"
      onClick={handleReopen}
    >
      <RefreshCcw className="h-3.5 w-3.5" />
      {isPending ? "Reabrindo..." : "Reabrir chamado"}
    </Button>
  );
}
