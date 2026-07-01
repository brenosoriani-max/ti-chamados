import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, icon: Icon, tone = "text-primary" }: { label: string; value: number | string; icon: LucideIcon; tone?: string }) {
  return (
    <Card className="border-none shadow-sm bg-card/60 hover:bg-card transition-colors duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          </div>
          <div className="rounded-xl p-2.5 bg-background border border-border/40">
            <Icon className={`h-5 w-5 ${tone}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
