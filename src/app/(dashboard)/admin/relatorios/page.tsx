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
  Download,
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
  priorityBreakdown: Array<{ priority: string; total: number; resolved: number }>;
  priorityTickets: Array<{ id: string; protocolo: string; titulo: string; priority: string; status: string; createdAt: string; createdBy: string }>;
  techWorkload: Array<{ id: string; name: string; openCount: number }>;
  creatorLeaderboard: Array<{ id: string; name: string; totalTickets: number; priorityBreakdown: Array<{ priority: string; total: number }> }>;
  techAttendance: Array<{ id: string; name: string; totalAtendimentos: number }>;
  daily: Array<{ day: string; count: number }>;
};

const PERIOD_OPTIONS = [
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
  { label: "90 dias", value: 90 },
  { label: "1 ano", value: 365 },
];

const PRIORITY_LABELS: Record<string, string> = {
  CRITICA: "Crítica",
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
};

const PRIORITY_COLORS: Record<string, string> = {
  CRITICA: "bg-red-500",
  ALTA: "bg-orange-500",
  MEDIA: "bg-yellow-500",
  BAIXA: "bg-emerald-500",
};



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



function RankList({
  title,
  items,
  icon: Icon,
  color,
  field,
  subtitle,
}: {
  title: string;
  items: Array<{ id: string; name: string; [key: string]: string | number | Array<{ priority: string; total: number }> }>; 
  icon: React.ElementType;
  color: string;
  field: string;
  subtitle?: string;
}) {
  const maxValue = Math.max(...items.map((item) => Number(item[field] ?? 0)), 1);

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">{title}</h2>
        </div>
        {subtitle && <span className="text-[10px] font-bold text-muted-foreground">{subtitle}</span>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/40">
        <div className="grid grid-cols-[auto_1fr_auto] border-b border-border/60 bg-muted/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          <span className="w-8">#</span>
          <span>Participante</span>
          <span className="text-right">Total</span>
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-border/60">
            {items.map((item, index) => {
              const metricValue = Number(item[field] ?? 0);
              return (
                <div key={item.id ?? `${item.name}-${index}`} className="px-3 py-3">
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                      {field === "totalTickets" && Array.isArray(item.priorityBreakdown) && item.priorityBreakdown.length > 0 && (
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {item.priorityBreakdown.map((entry) => `${PRIORITY_LABELS[entry.priority] ?? entry.priority}: ${entry.total}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="text-sm font-black text-foreground">{metricValue}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${Math.max((metricValue / maxValue) * 100, 6)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhum dado.</p>
        )}
      </div>
    </div>
  );
}

function LeaderTableCard({
  title,
  subtitle,
  items,
  field,
  color,
}: {
  title: string;
  subtitle?: string;
  items: Array<{ id: string; name: string; [key: string]: string | number | Array<{ priority: string; total: number }> }>;
  field: string;
  color: string;
}) {
  const icon = field === "totalTickets" ? Users : ShieldCheck;

  return (
    <RankList
      title={title}
      items={items}
      icon={icon}
      color={color}
      field={field}
      subtitle={subtitle}
    />
  );
}

function PriorityTableCard({
  title,
  items,
  tickets,
  expandedPriority,
  onTogglePriority,
}: {
  title: string;
  items: Array<{ priority: string; total: number; resolved: number }>;
  tickets: Array<{ id: string; protocolo: string; titulo: string; priority: string; status: string; createdAt: string; createdBy: string }>;
  expandedPriority: string | null;
  onTogglePriority: (priority: string) => void;
}) {
  const totalAll = items.reduce((sum, entry) => sum + entry.total, 0);
  const MAX_VISIBLE_TICKETS = 8;
  const DEFAULT_VISIBLE_TICKETS = 3;

  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">{title}</h2>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground">{totalAll} total</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/40">
        <div className="grid grid-cols-[1.2fr_auto] border-b border-border/60 bg-muted/20 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          <span>Prioridade</span>
          <span className="text-right">Total</span>
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-border/60">
            {items.map((entry) => {
              const allPriorityTickets = tickets.filter((ticket) => ticket.priority === entry.priority);
              const visibleTickets = allPriorityTickets.slice(0, DEFAULT_VISIBLE_TICKETS);
              const expandedTickets = allPriorityTickets.slice(0, MAX_VISIBLE_TICKETS);
              const isExpanded = expandedPriority === entry.priority;
              const displayedTickets = isExpanded ? expandedTickets : visibleTickets;

              return (
                <div key={entry.priority} className="px-3 py-3">
                  <div className="grid grid-cols-[1.2fr_auto] items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onTogglePriority(entry.priority)}
                      className="flex min-w-0 items-center gap-3 text-left"
                    >
                      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${PRIORITY_COLORS[entry.priority] ?? "bg-slate-500"}`} />
                      <div className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{PRIORITY_LABELS[entry.priority] ?? entry.priority}</span>
                        <span className="text-[10px] text-muted-foreground">{entry.resolved} resolvidos</span>
                      </div>
                    </button>
                    <span className="text-sm font-black text-foreground">{entry.total}</span>
                  </div>

                  {displayedTickets.length > 0 && (
                    <div className="mt-3 space-y-2 rounded-xl border border-border/60 bg-background/30 p-2.5">
                      {displayedTickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-start justify-between gap-3 rounded-lg bg-background/40 px-2 py-1.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11px] font-semibold text-foreground">{ticket.titulo}</p>
                            <p className="text-[9px] text-muted-foreground">#{ticket.protocolo} · {ticket.status}</p>
                            <p className="mt-0.5 text-[9px] text-muted-foreground">Criado por: {ticket.createdBy ?? "—"}</p>
                          </div>
                          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                            {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                          </span>
                        </div>
                      ))}

                      {allPriorityTickets.length > displayedTickets.length && (
                        <button
                          type="button"
                          onClick={() => onTogglePriority(entry.priority)}
                          className="w-full text-left text-[10px] font-black uppercase tracking-[0.12em] text-primary"
                        >
                          {isExpanded ? "Mostrar menos" : `Ver mais (${allPriorityTickets.length - displayedTickets.length})`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sem dados.</p>
        )}
      </div>
    </div>
  );
}

function buildCsvReport(data: ReportData | null, period: number) {
  if (!data) return "";

  const csvEscape = (value: string | number | null | undefined) => {
    const text = String(value ?? "").replace(/\r?\n/g, " ").replace(/"/g, '""');
    return `"${text}"`;
  };

  const summaryRows = [
    ["Relatório TI Chamados", ""],
    ["Período", `${period} dias`],
    ["", ""],
    ["Resumo", "Valor"],
    ["Chamados no período", data.summary.totalInPeriod],
    ["Resolvidos", data.summary.resolvedInPeriod],
    ["Taxa de resolução", `${data.summary.resolutionRatePct}%`],
    ["Abertos hoje", data.summary.openCount],
    ["SLA em dia", `${data.summary.slaCompliancePct}%`],
    ["SLA violado", data.summary.slaViolatedCount],
    ["Tempo médio de resolução", data.summary.avgResolutionHours ? `${data.summary.avgResolutionHours}h` : "-"],
    ["Avaliação média", data.summary.avgRating ? `${data.summary.avgRating} / 5` : "-"],
    ["", ""],
    ["Prioridade", "Total", "Resolvidos"],
    ...data.priorityBreakdown.map((item) => [
      PRIORITY_LABELS[item.priority] ?? item.priority,
      item.total,
      item.resolved,
    ]),
    ["", ""],
    ["Usuário que mais criou chamados", "Total", "Detalhe por prioridade"],
    ...data.creatorLeaderboard.map((item) => [
      item.name,
      item.totalTickets,
      (item.priorityBreakdown ?? []).map((p) => `${PRIORITY_LABELS[p.priority] ?? p.priority}: ${p.total}`).join(" | "),
    ]),
    ["", ""],
    ["Técnico que mais atendeu", "Total atendimentos"],
    ...data.techAttendance.map((item) => [item.name, item.totalAtendimentos]),
    ["", ""],
    ["Detalhes dos chamados por prioridade", "", "", "", "", ""],
    ["Prioridade", "Protocolo", "Título", "Status", "Criado por", "Data"],
    ...data.priorityTickets.map((ticket) => [
      PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
      ticket.protocolo,
      ticket.titulo,
      ticket.status,
      ticket.createdBy ?? "—",
      new Date(ticket.createdAt).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    ]),
  ];

  const csv = summaryRows
    .map((row) => row.map((cell) => csvEscape(cell)).join(";"))
    .join("\n");

  return `\ufeff${csv}`;
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedTechnician, setSelectedTechnician] = useState("todos");
  const [expandedPriority, setExpandedPriority] = useState<string | null>(null);

  const togglePriority = (priority: string) => {
    setExpandedPriority((current) => (current === priority ? null : priority));
  };

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
  const maxPriority = Math.max(...(data?.priorityBreakdown.map((p) => p.total) ?? [1]), 1);
  const categoryOptions = ["todos", ...(data?.categoryBreakdown.map((item) => item.categoryName) ?? [])];
  const technicianOptions = ["todos", ...(data?.techWorkload.map((item) => item.name) ?? [])];

  const filteredCategoryBreakdown = data
    ? data.categoryBreakdown.filter((item) => selectedCategory === "todos" || item.categoryName === selectedCategory)
    : [];

  const filteredTechWorkload = data
    ? data.techWorkload.filter((item) => selectedTechnician === "todos" || item.name === selectedTechnician)
    : [];

  return (
    <div className="flex flex-col gap-8 ">
      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Visão executiva
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">Relatórios</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Indicadores de performance, SLA e produtividade da equipe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap md:justify-end">
          <div className="flex items-center gap-2 rounded-2xl border bg-muted/20 p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`h-9 rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
                  period === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadData(period)}
            className="h-9 w-9 rounded-xl border border-border/70 bg-background p-0 text-muted-foreground"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const csv = buildCsvReport(data, period);
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.setAttribute("href", url);
              a.setAttribute("download", `relatorio_chamados_${new Date().toISOString().slice(0, 10)}.csv`);
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="gap-2 rounded-xl border-border/70 bg-background text-foreground"
            disabled={!data}
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </header>

      {isLoading ? (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 ">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : !data ? null : (
        <>
          <div className="grid gap-2 grid-cols-2 lg:grid-cols-2">
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

          </div>

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
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
              label="Taxa de resolução"
              value={`${s!.resolutionRatePct}%`}
              sub={`${s!.resolvedInPeriod} de ${s!.totalInPeriod}`}
              icon={BarChart3}
              tone="text-primary"
              bg="bg-primary/5"
              border="border-primary/20"
            />
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">Resumo em tabela</h2>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span>Categoria</span>
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="h-9 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category === "todos" ? "Todas" : category}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span>Técnico</span>
                  <select
                    value={selectedTechnician}
                    onChange={(event) => setSelectedTechnician(event.target.value)}
                    className="h-9 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground outline-none"
                  >
                    {technicianOptions.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech === "todos" ? "Todos" : tech}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border/60">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">Categoria</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">{filteredCategoryBreakdown.length} itens</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-muted/20 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Categoria</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                        <th className="px-4 py-3 font-semibold text-right">Resolvidos</th>
                        <th className="px-4 py-3 font-semibold text-right">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategoryBreakdown.length > 0 ? (
                        filteredCategoryBreakdown.map((category) => {
                          const taxRate = category.total > 0 ? Math.round((category.resolved / category.total) * 100) : 0;
                          return (
                            <tr key={category.categoryId ?? category.categoryName} className="border-t border-border/60">
                              <td className="px-4 py-3 align-middle font-medium text-foreground">{category.categoryName}</td>
                              <td className="px-4 py-3 align-middle text-right font-semibold">{category.total}</td>
                              <td className="px-4 py-3 align-middle text-right text-emerald-600">{category.resolved}</td>
                              <td className="px-4 py-3 align-middle text-right font-medium text-primary">{taxRate}%</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Nenhuma categoria encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-border/60">
                <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-4 py-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-foreground">Técnico</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.16em] text-muted-foreground">{filteredTechWorkload.length} itens</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-muted/20 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Técnico</th>
                        <th className="px-4 py-3 font-semibold text-right">Em aberto</th>
                        <th className="px-4 py-3 font-semibold text-right">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTechWorkload.length > 0 ? (
                        filteredTechWorkload.map((tech) => {
                          const status = tech.openCount > 5 ? "Crítico" : tech.openCount > 0 ? "Monitorado" : "Livre";
                          return (
                            <tr key={tech.id} className="border-t border-border/60">
                              <td className="px-4 py-3 align-middle font-medium text-foreground">{tech.name}</td>
                              <td className="px-4 py-3 align-middle text-right font-semibold">{tech.openCount}</td>
                              <td className="px-4 py-3 align-middle text-right">
                                <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${tech.openCount > 5 ? "bg-red-500/10 text-red-500" : tech.openCount > 0 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                                  {status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            Nenhum técnico encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="gap-6">
            <PriorityTableCard
              title="Prioridade dos chamados"
              items={data.priorityBreakdown}
              tickets={data.priorityTickets}
              expandedPriority={expandedPriority}
              onTogglePriority={togglePriority}
            />
          </div>

        

          <div className="grid gap-6 lg:grid-cols-2">
            <LeaderTableCard
              title="Quem mais criou chamados"
              subtitle={`Últimos ${period} dias`}
              items={data.creatorLeaderboard}
              field="totalTickets"
              color="text-primary"
            />
            <LeaderTableCard
              title="Quem mais atendeu"
              subtitle="Técnicos"
              items={data.techAttendance}
              field="totalAtendimentos"
              color="text-emerald-500"
            />
          </div>

          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="font-black text-sm uppercase tracking-[0.14em]">Chamados por categoria</h2>
              <span className="text-[10px] font-bold text-muted-foreground ml-1">(últimos {period} dias)</span>
            </div>
            {data.categoryBreakdown.length > 0 ? (
              <div className="space-y-3 mt-4">
                {data.categoryBreakdown.map((cat) => {
                  const resolutionPct = cat.total > 0 ? Math.round((cat.resolved / cat.total) * 100) : 0;
                  return (
                    <div key={cat.categoryId ?? cat.categoryName} className="rounded-2xl border border-border/60 bg-background/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{cat.categoryName}</p>
                          <p className="text-[10px] text-muted-foreground">{resolutionPct}% resolvidos</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                          {cat.resolved} ok
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <MiniBar
                            label={cat.categoryName}
                            value={cat.total}
                            max={maxCategory}
                            color="bg-primary"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum chamado categorizado no período.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PriorityTicketList({
  items,
  priority,
}: {
  items: Array<{ id: string; protocolo: string; titulo: string; priority: string; status: string; createdAt: string }>;
  priority: string;
}) {
  const filtered = items.filter((item) => item.priority === priority);
  const MAX_DETAIL_ITEMS = 5;

  if (filtered.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-background/30 p-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
          {PRIORITY_LABELS[priority] ?? priority}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">{filtered.length} chamados</span>
      </div>

      <div className="space-y-1.5">
        {filtered.slice(0, MAX_DETAIL_ITEMS).map((ticket) => (
          <div key={ticket.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/40 px-2 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-foreground">{ticket.titulo}</p>
              <p className="text-[9px] text-muted-foreground">#{ticket.protocolo} · {ticket.status}</p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold text-foreground">
              {ticket.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
