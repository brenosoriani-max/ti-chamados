import { Priority } from "@/types";

export interface SLARule {
  responseHours: number;
  solutionHours: number;
}

export const defaultSla: Record<Priority, SLARule> = {
  [Priority.BAIXA]: { responseHours: 24, solutionHours: 72 },
  [Priority.MEDIA]: { responseHours: 8, solutionHours: 24 },
  [Priority.ALTA]: { responseHours: 4, solutionHours: 8 },
  [Priority.CRITICA]: { responseHours: 1, solutionHours: 4 }
};

export function calculateDueDates(priority: Priority, sla?: SLARule | null) {
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
