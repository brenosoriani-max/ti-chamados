import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Headphones, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type AuthShellProps = { icon: LucideIcon; eyebrow: string; title: string; description: string; children: ReactNode; footer: ReactNode };

export function AuthShell({ icon: Icon, eyebrow, title, description, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(560px,0.95fr)]">
      <aside className="relative hidden min-h-screen overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[32rem] w-[32rem] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -right-28 h-[30rem] w-[30rem] rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-1/3 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex items-center gap-3 font-bold tracking-tight"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-950 shadow-lg"><Headphones className="h-5 w-5" /></span>TI Chamados</div>
        <div className="relative my-auto max-w-lg">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">Central de suporte</p>
          <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight xl:text-5xl">Tecnologia simples para quem precisa trabalhar.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">Abra chamados, acompanhe atendimentos e receba suporte remoto em um único lugar.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">{["Chamados em um só lugar", "Atualizações em tempo real", "Acesso protegido"].map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-5 text-slate-200 backdrop-blur"><span className="mb-3 flex h-6 w-6 items-center justify-center rounded-lg bg-sky-300/15 text-xs font-bold text-sky-200">0{index + 1}</span>{item}</div>)}</div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 className="h-4 w-4 text-sky-300" /> Ambiente seguro para sua equipe</div>
      </aside>

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-5 sm:px-6 lg:px-10 xl:px-16">
      <div className="pointer-events-none absolute left-[-12rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-10rem] h-[30rem] w-[30rem] rounded-full bg-sky-400/10 blur-3xl" />
      <section className="relative w-full max-w-xl">
        <div className="mb-10 flex items-center justify-between"><div className="flex items-center gap-2.5 font-bold tracking-tight text-foreground lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><ShieldCheck className="h-5 w-5" /></span>TI Chamados</div><span className="hidden text-xs font-medium text-muted-foreground lg:block">Portal de atendimento</span><ThemeToggle /></div>
        <div className="rounded-3xl border border-border/80 bg-card/90 p-6 shadow-xl shadow-slate-950/[0.06] backdrop-blur sm:p-8"><div className="mb-7"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-sky-400/15 text-primary ring-1 ring-primary/10"><Icon className="h-5 w-5" /></div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>{children}</div>
        <div className="mt-6 text-center text-xs text-muted-foreground">{footer}</div>
      </section>
      </main>
    </div>
  );
}
