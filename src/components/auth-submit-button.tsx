"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AuthSubmitButton({ children, pending: externallyPending = false }: { children: React.ReactNode; pending?: boolean }) {
  const { pending } = useFormStatus();
  const isPending = pending || externallyPending;

  return (
    <Button type="submit" disabled={isPending} className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]">
      {isPending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Aguarde...</> : children}
    </Button>
  );
}
