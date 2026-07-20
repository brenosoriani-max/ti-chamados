import { LockKeyhole, Mail } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth-shell";
import { AuthPasswordInput } from "@/components/auth-password-input";
import { AuthSubmitButton } from "@/components/auth-submit-button";

export default function LoginPage() {
  return (
    <AuthShell
      icon={LockKeyhole}
      eyebrow="Acesso seguro"
      title="Bem-vindo de volta"
      description="Entre para acompanhar seus chamados e solicitar suporte quando precisar."
      footer={<>Não tem uma conta? <Link href="/register" className="font-bold text-primary hover:underline">Cadastre-se agora</Link></>}
    >
      <form action="/api/auth/login" method="post" className="space-y-5">
        <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">1</span>Informe seus dados de acesso</div>
          <div className="space-y-4">
            <div className="space-y-1.5">
          <label className="ml-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">E-mail corporativo <span className="text-primary">*</span></label>
          <div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input name="email" type="email" autoComplete="email" placeholder="email@empresa.com" className="h-12 bg-background pl-11" required /></div>
        </div>
        <div className="space-y-1.5">
          <div className="ml-1 flex items-center justify-between"><label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Senha <span className="text-primary">*</span></label><Link href="/forgot-password" className="text-[11px] font-semibold text-primary hover:underline">Esqueceu a senha?</Link></div>
          <AuthPasswordInput autoComplete="current-password" placeholder="Digite sua senha" />
        </div>
          </div>
        </div>
        <AuthSubmitButton>Entrar no portal</AuthSubmitButton>
      </form>
      <p className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-center text-[11px] leading-5 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Acesso restrito e protegido para sua segurança.</p>
    </AuthShell>
  );
}
