import { UserPlus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { registerAction } from "@/app/actions";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar para o login
        </Link>

        <Card className="border border-border/40 shadow-2xl bg-card/60 rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <UserPlus className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Crie sua conta</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Cadastre-se para abrir chamados e gerenciar seu suporte técnico.</p>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form action={registerAction} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nome Completo</label>
                <Input name="name" placeholder="Como devemos chamar você?" className="h-12 bg-background/50 border-border/40 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">E-mail Corporativo</label>
                <Input name="email" type="email" placeholder="email@empresa.com" className="h-12 bg-background/50 border-border/40 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Sua Senha</label>
                <Input name="password" type="password" placeholder="••••••••" className="h-12 bg-background/50 border-border/40 rounded-xl" required />
              </div>
              
              <div className="pt-4">
                <Button className="w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-all">
                  Cadastrar Agora
                </Button>
              </div>

              <p className="text-[10px] text-center text-muted-foreground/60 font-medium px-4">
                Ao se cadastrar, seu endereço IP será vinculado automaticamente ao seu perfil para facilitar o suporte remoto.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
