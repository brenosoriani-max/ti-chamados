"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Mail, User } from "lucide-react";
import { registerAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { AuthSubmitButton } from "@/components/auth-submit-button";

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, {});
  useEffect(() => { if (state.error) toast.error(state.error); }, [state.error]);
  return <form action={formAction} className="space-y-5"><div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5"><div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">1</span>Preencha seus dados para começar</div><div className="space-y-4"><div className="space-y-1.5"><label className="ml-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome completo <span className="text-primary">*</span></label><div className="relative"><User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="name" autoComplete="name" placeholder="Como devemos chamar você?" className="h-12 bg-background pl-11" required /></div></div><div className="space-y-1.5"><label className="ml-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail corporativo <span className="text-primary">*</span></label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="email" type="email" autoComplete="email" placeholder="email@empresa.com" className="h-12 bg-background pl-11" required /></div></div><div className="space-y-1.5"><label className="ml-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Crie uma senha <span className="text-primary">*</span></label><AuthPasswordInput autoComplete="new-password" placeholder="Mínimo de 8 caracteres" /><p className="ml-1 text-[11px] text-muted-foreground">Use pelo menos 8 caracteres para uma senha mais segura.</p></div></div></div><AuthSubmitButton>Criar conta</AuthSubmitButton><p className="border-t border-border pt-5 text-center text-[11px] leading-5 text-muted-foreground">Ao se cadastrar, seu endereço IP será associado ao perfil para facilitar o suporte remoto e reforçar a segurança.</p></form>;
}
