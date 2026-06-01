import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, icon: Icon, tone = "text-primary" }: { label: string; value: number | string; icon: LucideIcon; tone?: string }) {
  return (
    <Card className="glass-card overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
            <p className="text-3xl font-black">{value}</p>
          </div>
          <div className={`rounded-2xl p-3 bg-muted/50 group-hover:bg-primary/10 transition-colors shadow-inner`}>
            <Icon className={`h-6 w-6 ${tone} drop-shadow-sm`} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1 flex-1 rounded-full bg-muted/50 overflow-hidden">
            <div className={`h-full premium-gradient opacity-40`} style={{ width: '60%' }} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground/50">LEVEL 1</span>
        </div>
      </CardContent>
    </Card>
  );
}
