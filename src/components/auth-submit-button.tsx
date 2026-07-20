"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AuthSubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.99]">
      {pending ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Aguarde...</> : children}
    </Button>
  );
}
