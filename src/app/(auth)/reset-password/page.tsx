
"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requirements = useMemo(
    () => [
      {
        label: "Pelo menos 8 caracteres",
        valid: password.length >= 8,
      },
      {
        label: "Uma letra maiúscula",
        valid: /[A-Z]/.test(password),
      },
      {
        label: "Uma letra minúscula",
        valid: /[a-z]/.test(password),
      },
      {
        label: "Um número",
        valid: /\d/.test(password),
      },
    ],
    [password]
  );

  const strength = requirements.filter((item) => item.valid).length;

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const strengthLabel = [
    "Muito fraca",
    "Fraca",
    "Razoável",
    "Boa",
    "Forte",
  ][strength];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (loading) return;

    if (!token) {
      setError("O link de recuperação é inválido.");
      return;
    }

    if (password.length < 8) {
      setError("Sua senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas informadas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const responseText = await response.text();

      let data: { error?: string; message?: string };

      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Resposta inesperada da API:", responseText);

        throw new Error(
          "Não foi possível processar a solicitação. Tente novamente."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível redefinir sua senha."
        );
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Link inválido
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Não encontramos um token de recuperação neste endereço.
            Solicite um novo link para continuar.
          </p>

          <button
            onClick={() => router.push("/forgot-password")}
            className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Solicitar novo link
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* Elementos decorativos */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-indigo-100/60 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Identidade visual */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
            >
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path d="M12 14v3" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Recuperação de senha
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Crie uma nova senha para recuperar o acesso à sua conta.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
          {success ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-10 w-10"
                >
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Senha alterada!
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sua senha foi redefinida com sucesso. Agora você pode
                acessar sua conta utilizando suas novas credenciais.
              </p>

              <button
                onClick={() => router.push("/login")}
                className="mt-8 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Acessar minha conta
              </button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h2 className="text-lg font-semibold text-slate-900">
                  Defina sua nova senha
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Utilize uma senha segura que você ainda não utiliza
                  em outros serviços.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nova senha */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Nova senha
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Digite sua nova senha"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      required
                      className={inputClass}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {showPassword ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>

                  {/* Força da senha */}
                  {password.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          Segurança da senha
                        </span>

                        <span
                          className={`text-xs font-semibold ${
                            strength >= 4
                              ? "text-emerald-600"
                              : strength >= 3
                                ? "text-blue-600"
                                : "text-amber-600"
                          }`}
                        >
                          {strengthLabel}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        {requirements.map((item, index) => (
                          <div
                            key={index}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              item.valid
                                ? "bg-emerald-500"
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Requisitos */}
                  <div className="mt-4 space-y-2">
                    {requirements.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2"
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                            item.valid
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {item.valid ? "✓" : "•"}
                        </span>

                        <span
                          className={`text-xs ${
                            item.valid
                              ? "text-emerald-700"
                              : "text-slate-500"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confirmação */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirmar nova senha
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmation ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError("");
                      }}
                      placeholder="Digite novamente sua senha"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={72}
                      required
                      className={`${inputClass} ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                            : "border-red-300 focus:border-red-400 focus:ring-red-400/10"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmation(!showConfirmation)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {showConfirmation ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>

                  {confirmPassword.length > 0 && (
                    <p
                      className={`mt-2 text-xs ${
                        passwordsMatch
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {passwordsMatch
                        ? "As senhas coincidem."
                        : "As senhas ainda não coincidem."}
                    </p>
                  )}
                </div>

                {/* Erro */}
                {error && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5 shrink-0 text-red-500"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4m0 4h.01" />
                    </svg>

                    <p className="text-sm leading-5 text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {/* Botão */}
                <button
                  type="submit"
                  disabled={
                    loading ||
                    password.length < 8 ||
                    password !== confirmPassword
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Atualizando senha...
                    </>
                  ) : (
                    "Redefinir minha senha"
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Proteção de conta · Recuperação segura de acesso
        </p>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
