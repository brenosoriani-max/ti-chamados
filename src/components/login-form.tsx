"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { AuthSubmitButton } from "@/components/auth-submit-button";

type LoginResponse = { error?: string; redirectUrl?: string };

export function LoginForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
      const result = (await response.json()) as LoginResponse;
      if (!response.ok || !result.redirectUrl) {
        toast.error(result.error ?? "Não foi possível entrar. Tente novamente.");
        return;
      }
      router.push(result.redirectUrl);
      router.refresh();
    } catch {
      toast.error("Não foi possível se comunicar com o servidor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return <form onSubmit={handleSubmit} className="space-y-5"><div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5"><div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">1</span>Informe seus dados de acesso</div><div className="space-y-4"><div className="space-y-1.5"><label className="ml-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail corporativo <span className="text-primary">*</span></label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="email" type="email" autoComplete="email" placeholder="email@empresa.com" className="h-12 bg-background pl-11" required /></div></div><div className="space-y-1.5"><div className="ml-1 flex items-center justify-between"><label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Senha <span className="text-primary">*</span></label><Link href="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">Esqueceu a senha?</Link></div><AuthPasswordInput autoComplete="current-password" placeholder="Digite sua senha" /></div></div></div><AuthSubmitButton pending={submitting}>Entrar no portal</AuthSubmitButton></form>;
}
