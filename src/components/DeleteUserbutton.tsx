"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/messages";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function deactivateUser() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || messages.users.deactivateError);

        toast.success("Usuário desativado com sucesso.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : messages.users.deactivateError);
      }
    });
  }

  function requestDeactivation() {
    toast.warning("Desativar usuário?", {
      description: `${userName} perderá o acesso ao sistema, mas o histórico será mantido.`,
      duration: 10_000,
      action: { label: "Desativar", onClick: deactivateUser },
      cancel: { label: "Cancelar", onClick: () => undefined },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      title="Desativar usuário"
      className="h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-500"
      onClick={requestDeactivation}
    >
      <UserX className="h-3.5 w-3.5" />
    </Button>
  );
}
