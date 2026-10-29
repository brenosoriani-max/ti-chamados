import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "text-primary",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <Card className="border border-border/60 bg-card/80 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-[-0.06em] text-foreground">
              {value}
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/60 shadow-inner shadow-slate-200/50">
            <Icon className={`h-5 w-5 ${tone}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
