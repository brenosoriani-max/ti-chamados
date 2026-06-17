import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";

export default function SuporteLoading() {
  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
