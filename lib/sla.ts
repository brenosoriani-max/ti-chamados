import type { Priority, SLA } from "@prisma/client";

export const defaultSla: Record<Priority, Pick<SLA, "responseHours" | "solutionHours">> = {
  BAIXA: { responseHours: 24, solutionHours: 72 },
  MEDIA: { responseHours: 8, solutionHours: 24 },
  ALTA: { responseHours: 4, solutionHours: 8 },
  CRITICA: { responseHours: 1, solutionHours: 4 }
};

export function calculateDueDates(priority: Priority, sla?: Pick<SLA, "responseHours" | "solutionHours"> | null) {
  const now = new Date();
  const rule = sla ?? defaultSla[priority];
  return {
    responseDueAt: new Date(now.getTime() + rule.responseHours * 60 * 60 * 1000),
    slaDueAt: new Date(now.getTime() + rule.solutionHours * 60 * 60 * 1000)
  };
}

export function slaState(dueAt: Date | string) {
  const remainingMs = new Date(dueAt).getTime() - Date.now();
  if (remainingMs < 0) return "vencido";
  if (remainingMs < 2 * 60 * 60 * 1000) return "risco";
  return "ok";
}
