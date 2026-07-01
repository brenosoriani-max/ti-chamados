import { Badge } from "@/components/ui/badge";
import { formatPriority, formatTicketStatus } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const variant = status === "ENCERRADO" || status === "RESOLVIDO" ? "success" : status === "CANCELADO" ? "danger" : "default";
  return <Badge variant={variant}>{formatTicketStatus(status)}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant = priority === "CRITICA" ? "danger" : priority === "ALTA" ? "warning" : priority === "BAIXA" ? "muted" : "default";
  return <Badge variant={variant}>{formatPriority(priority)}</Badge>;
}
