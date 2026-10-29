"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { messages } from "@/lib/messages";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  isActive?: boolean;
  className?: string;
}

export function DeleteUserButton({ userId, userName, isActive = true, className }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function activateUser() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users?id=${userId}&mode=activate`, { method: "DELETE" });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Não foi possível reativar o usuário.");

        toast.success("Usuário reativado com sucesso.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível reativar o usuário.");
      }
    });
  }

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

  function deleteUser() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users?id=${userId}&mode=delete`, { method: "DELETE" });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || messages.users.deleteError);

        toast.success("Usuário excluído com sucesso.");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : messages.users.deleteError);
      }
    });
  }

  function requestActivation() {
    toast.warning("Reativar usuário?", {
      description: `${userName} voltará a ter acesso ao sistema e poderá continuar normalmente.`,
      duration: 10_000,
      action: { label: "Reativar", onClick: activateUser },
      cancel: { label: "Cancelar", onClick: () => undefined },
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

  function requestDeletion() {
    toast.warning("Excluir usuário permanentemente?", {
      description: `${userName} será removido do sistema e não poderá mais acessar. Só será permitida exclusão sem chamados vinculados.`,
      duration: 10_000,
      action: { label: "Excluir", onClick: deleteUser },
      cancel: { label: "Cancelar", onClick: () => undefined },
    });
  }

  return (
    <div className={`flex items-center justify-end gap-2 ${className ?? ""}`}>
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        title={isActive ? "Desativar usuário" : "Reativar usuário"}
        className="h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-500"
        onClick={isActive ? requestDeactivation : requestActivation}
      >
        {isActive ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        title="Excluir usuário"
        className="h-8 w-8 rounded-lg text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
        onClick={requestDeletion}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
