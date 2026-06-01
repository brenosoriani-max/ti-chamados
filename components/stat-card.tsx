import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, icon: Icon, tone = "text-primary" }: { label: string; value: number | string; icon: LucideIcon; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between pt-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className={`h-5 w-5 ${tone}`} />
      </CardContent>
    </Card>
  );
}
