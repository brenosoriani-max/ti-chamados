
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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error ?? "Não foi possível enviar o e-mail.");
        return;
      }

      setSubmitted(true);
      toast.success("Solicitação processada com sucesso.");
    } catch {
      toast.error("Não foi possível se comunicar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="overflow-hidden rounded-3xl border border-border/40 bg-card/60 shadow-2xl">
          <CardHeader className="p-8 pb-4">
            <Link
              href="/login"
              className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-all hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Link>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
              <Mail className="h-6 w-6" />
            </div>

            <CardTitle className="text-3xl font-bold tracking-tight">
              Recuperar Senha
            </CardTitle>

            <p className="mt-2 text-sm text-muted-foreground">
              Digite seu e-mail abaixo para receber as instruções de recuperação de senha.
            </p>
          </CardHeader>

          <CardContent className="p-8 pt-4">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    E-mail corporativo
                  </label>

                  <Input
                    type="email"
                    placeholder="email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-border/40 bg-background/50"
                    autoComplete="email"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-4 h-14 w-full rounded-2xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {loading ? "Enviando..." : "Enviar Link"}
                </Button>
              </form>
            ) : (
              <div className="space-y-4 py-6 text-center">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-medium leading-relaxed text-emerald-700">
                  Se o endereço informado estiver cadastrado, você receberá um link para redefinir sua senha.
                </div>

                <p className="text-xs text-muted-foreground">
                  Verifique sua caixa de entrada e também a pasta de spam.
                  O link terá validade de 30 minutos.
                </p>

                <Button
                  asChild
                  variant="outline"
                  className="mt-4 h-12 w-full rounded-xl"
                >
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
