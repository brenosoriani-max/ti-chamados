"use client";

import { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success("E-mail de recuperação enviado para " + email);
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border/40 shadow-2xl bg-card/60 rounded-3xl overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <Link
              href="/login"
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-all mb-4 uppercase tracking-wider"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao Login
            </Link>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
              <Mail className="h-6 w-6" />
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight">Recuperar Senha</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Digite seu e-mail abaixo para receber as instruções de recuperação de senha.
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    E-mail corporativo
                  </label>
                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 bg-background/50 border-border/40 rounded-xl"
                    required
                  />
                </div>
                <Button className="w-full h-14 rounded-2xl text-sm font-bold uppercase tracking-widest mt-4 shadow-xl shadow-primary/10 hover:scale-[1.01] active:scale-[0.99] transition-all">
                  Enviar Link
                </Button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm font-medium rounded-2xl leading-relaxed">
                  Enviamos um link com instruções detalhadas para o e-mail: <strong className="block mt-1 text-emerald-800">{email}</strong>
                </div>
                <p className="text-xs text-muted-foreground">
                  Se você não receber o e-mail em alguns minutos, verifique sua caixa de spam.
                </p>
                <Button asChild variant="outline" className="w-full h-12 rounded-xl mt-4">
                  <Link href="/login">Voltar ao portal</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
