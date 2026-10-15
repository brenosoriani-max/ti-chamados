import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell icon={LockKeyhole} eyebrow="Acesso seguro" title="Bem-vindo de volta" description="Entre para acompanhar seus chamados e solicitar suporte quando precisar." footer={<>Não tem uma conta? <Link href="/register" className="font-bold text-primary hover:underline">Cadastre-se agora</Link></>}>
      <LoginForm />
      <p className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-center text-[11px] leading-5 text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Acesso restrito e protegido para sua segurança.</p>
    </AuthShell>
  );
}
