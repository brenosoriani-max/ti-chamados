import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border/40 shadow-2xl bg-card/60 rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Bem-vindo</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Acesse o portal de suporte técnico da empresa.</p>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form action="/api/auth/login" method="post" className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail</label>
                <Input name="email" type="email" placeholder="email@empresa.com" className="h-12 bg-background/50 border-border/40 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Senha</label>
                  <Link href="/forgot-password" className="text-[10px] font-bold text-primary hover:underline">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input name="password" type="password" placeholder="••••••••" className="h-12 bg-background/50 border-border/40 rounded-xl" required />
              </div>
              <Button className="w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-widest mt-4 shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-all">
                Acessar Portal
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-xs text-muted-foreground">
                Não tem uma conta?{" "}
                <Link href="/register" className="text-primary font-bold hover:underline">
                  Cadastre-se agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-[10px] text-center text-muted-foreground/40 font-medium px-8 leading-relaxed">
          O acesso é restrito a colaboradores autorizados. Suas credenciais e endereço IP são monitorados para fins de segurança.
        </p>
      </div>
    </main>
  );
}
