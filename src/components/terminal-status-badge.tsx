import { cn } from "@/lib/utils";

export function TerminalStatusBadge({ status }: { status: string }) {
  const online = status === "ONLINE";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-2 rounded-md px-2 text-[10px] font-bold uppercase tracking-widest",
        online
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          online ? "bg-emerald-500" : "bg-muted-foreground/50"
        )}
      />
      {status}
    </span>
  );
}
