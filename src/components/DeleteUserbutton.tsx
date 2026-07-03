"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserX, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConfirmDeactivate = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erro ao desativar usuário");
        }

        toast.warning("Usuário desativado com sucesso");
        setIsModalOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao desativar usuário");
      }
    });
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
        onClick={() => setIsModalOpen(true)}
      >
        <UserX className="h-3.5 w-3.5" />
      </Button>

      {isModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isPending && setIsModalOpen(false)}
            />

            {/* Modal */}
            <div className="relative z-[101] bg-card border border-border/40 rounded-2xl shadow-2xl w-full max-w-sm mx-auto p-6 flex flex-col gap-5">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-3 pr-6">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">Desativar usuário</h3>
                  <p className="text-xs text-muted-foreground leading-tight">Essa ação pode ser revertida depois.</p>
                </div>
              </div>

              <p className="text-sm text-foreground/80 leading-relaxed">
                Tem certeza que deseja desativar <span className="font-bold">{userName}</span>? O usuário perderá acesso ao sistema, mas o histórico de chamados será mantido.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl text-xs font-bold"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleConfirmDeactivate}
                  disabled={isPending}
                >
                  {isPending ? "Desativando..." : "Desativar"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}