import { UserPlus } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";

export default function RegisterPage() {
  return (
    <AuthShell icon={UserPlus} eyebrow="Novo acesso" title="Crie sua conta" description="Cadastre-se para abrir chamados e acompanhar o atendimento da sua equipe." footer={<>Já possui uma conta? <Link href="/login" className="font-bold text-primary hover:underline">Entrar no portal</Link></>}>
      <RegisterForm />
    </AuthShell>
  );
}
