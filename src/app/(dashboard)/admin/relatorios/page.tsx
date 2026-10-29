"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  ShieldCheck,
  Gauge,
  Star,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  CalendarDays,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReportData = {
  period: number;
  summary: {
    totalInPeriod: number;
    resolvedInPeriod: number;
    openCount: number;
    slaViolatedCount: number;
    slaOkCount: number;
    slaCompliancePct: number;
    resolutionRatePct: number;
    avgResolutionHours: number | null;
    avgRating: number | null;
    ratingCount: number;
  };
  categoryBreakdown: Array<{ categoryId: string; categoryName: string; total: number; resolved: number }>;
  techWorkload: Array<{ id: string; name: string; openCount: number }>;
  daily: Array<{ day: string; count: number }>;
};

const PERIOD_OPTIONS = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "1 ano", value: 365 },
];

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "text-foreground",
  bg = "bg-card",
  border = "border-border/60",
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tone?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <div className={`rounded-2xl border ${border} ${bg} p-5 space-y-3`}>
      <div className={`flex items-center gap-2 ${tone}`}>
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className={`text-3xl font-black ${tone}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color = "bg-primary" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground truncate max-w-[60%]">{label}</span>
        <span className="text-xs font-black text-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted/50">
        <div
          className={`h-1.5 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function DailyChart({ daily }: { daily: Array<{ day: string; count: number }> }) {
  const max = Math.max(...daily.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-24">
        {daily.map((d) => {
          const height = Math.max(Math.round((d.count / max) * 100), 4);
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center justify-end gap-1 group" title={`${d.day}: ${d.count}`}>
              <div
                className="w-full rounded-t bg-primary/60 group-hover:bg-primary transition-colors"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>{daily[0]?.day ? new Date(daily[0].day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}</span>
        <span>{daily[daily.length - 1]?.day ? new Date(daily[daily.length - 1].day).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : ""}</span>
      </div>
    </div>
  );
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async (days: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?period=${days}`);
      if (!response.ok) throw new Error();
      const json = await response.json();
      setData(json);
    } catch {
      toast.error("Não foi possível carregar o relatório.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  const s = data?.summary;
  const maxCategory = Math.max(...(data?.categoryBreakdown.map((c) => c.total) ?? [1]));
  const maxTech = Math.max(...(data?.techWorkload.map((t) => t.openCount) ?? [1]), 1);

  return (
    <div className="flex flex-col gap-8 max-w-5xl">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest leading-none mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Visão Executiva
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground font-medium">
            Indicadores de performance, SLA e produtividade da equipe.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-[0.12em] border transition-all ${
                period === opt.value
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadData(period)}
            className="gap-2 text-muted-foreground"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          {/* KPI Row */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Chamados abertos"
              value={s!.totalInPeriod}
              sub={`Últimos ${period} dias`}
              icon={Hash}
            />
            <MetricCard
              label="Resolvidos"
              value={s!.resolvedInPeriod}
              sub={`${s!.resolutionRatePct}% de resolução`}
              icon={CheckCircle2}
              tone="text-emerald-600"
              bg="bg-emerald-500/5"
              border="border-emerald-500/20"
            />
            <MetricCard
              label="SLA em dia"
              value={`${s!.slaCompliancePct}%`}
              sub={`${s!.slaOkCount} ok · ${s!.slaViolatedCount} violados`}
              icon={s!.slaCompliancePct >= 80 ? ShieldCheck : Gauge}
              tone={s!.slaCompliancePct >= 80 ? "text-emerald-600" : "text-red-500"}
              bg={s!.slaCompliancePct >= 80 ? "bg-emerald-500/5" : "bg-red-500/5"}
              border={s!.slaCompliancePct >= 80 ? "border-emerald-500/20" : "border-red-500/20"}
            />
            <MetricCard
              label="Tempo médio"
              value={s!.avgResolutionHours != null ? `${s!.avgResolutionHours}h` : "—"}
              sub="Para resolução"
              icon={Clock}
              tone="text-sky-500"
              bg="bg-sky-500/5"
              border="border-sky-500/20"
            />
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Em aberto hoje"
              value={s!.openCount}
              sub="Aguardando atendimento"
              icon={TrendingUp}
              tone="text-amber-500"
              bg="bg-amber-500/5"
              border="border-amber-500/20"
            />
            <MetricCard
              label="SLA violado"
              value={s!.slaViolatedCount}
              sub="Chamados vencidos"
              icon={AlertTriangle}
              tone={s!.slaViolatedCount > 0 ? "text-red-500" : "text-muted-foreground"}
              bg={s!.slaViolatedCount > 0 ? "bg-red-500/5" : "bg-card"}
              border={s!.slaViolatedCount > 0 ? "border-red-500/20" : "border-border/60"}
            />
            <MetricCard
              label="Avaliação média"
              value={s!.avgRating != null ? `${s!.avgRating}/5` : "—"}
              sub={s!.ratingCount > 0 ? `${s!.ratingCount} avaliações` : "Sem avaliações"}
              icon={Star}
              tone="text-amber-500"
              bg="bg-amber-500/5"
              border="border-amber-500/20"
            />
            <MetricCard
              label="Taxa de resolução"
              value={`${s!.resolutionRatePct}%`}
              sub={`${s!.resolvedInPeriod} de ${s!.totalInPeriod}`}
              icon={BarChart3}
              tone="text-primary"
              bg="bg-primary/5"
              border="border-primary/20"
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Volume diário */}
            <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h2 className="font-black text-sm uppercase tracking-[0.14em]">Volume diário</h2>
              </div>
              {data.daily.length > 0 ? (
                <DailyChart daily={data.daily} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhum dado para o período.
                </p>
              )}
            </div>

            {/* Fila por técnico */}
            <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-sky-400" />
                <h2 className="font-black text-sm uppercase tracking-[0.14em]">Fila por técnico</h2>
              </div>
              {data.techWorkload.length > 0 ? (
                <div className="space-y-3">
                  {data.techWorkload.map((tech) => (
                    <div key={tech.id} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-sky-500/10 flex items-center justify-center text-[11px] font-black text-sky-500 shrink-0">
                        {tech.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <MiniBar
                          label={tech.name}
                          value={tech.openCount}
                          max={maxTech}
                          color={tech.openCount > 5 ? "bg-red-500" : "bg-sky-500"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Nenhum técnico encontrado.
                </p>
              )}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="rounded-3xl border border-border/60 bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="font-black text-sm uppercase tracking-[0.14em]">Chamados por categoria</h2>
              <span className="text-[10px] font-bold text-muted-foreground ml-1">(últimos {period} dias)</span>
            </div>
            {data.categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {data.categoryBreakdown.map((cat) => {
                  const resolutionPct = cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0;
                  return (
                    <div key={cat.categoryId ?? cat.categoryName} className="flex items-center gap-4">
                      <div className="w-32 shrink-0">
                        <span className="text-xs font-semibold text-foreground truncate block">{cat.categoryName}</span>
                        <span className="text-[10px] text-muted-foreground">{resolutionPct}% resolvidos</span>
                      </div>
                      <div className="flex-1">
                        <MiniBar
                          label={cat.categoryName}
                          value={cat.total}
                          max={maxCategory}
                          color="bg-primary"
                        />
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-foreground">{cat.total}</span>
                        <p className="text-[10px] text-emerald-600">{cat.resolved} ok</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Nenhum chamado categorizado no período.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
