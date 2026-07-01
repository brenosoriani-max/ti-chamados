import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTicketStatus(status: string) {
  const labels: Record<string, string> = {
    ABERTO: "Aberto",
    EM_ANALISE: "Em analise",
    EM_ATENDIMENTO: "Em atendimento",
    AGUARDANDO_CLIENTE: "Aguardando cliente",
    RESOLVIDO: "Resolvido",
    ENCERRADO: "Encerrado",
    CANCELADO: "Cancelado"
  };
  return labels[status] ?? status;
}

export function formatPriority(priority: string) {
  const labels: Record<string, string> = {
    BAIXA: "Baixa",
    MEDIA: "Media",
    ALTA: "Alta",
    CRITICA: "Critica"
  };
  return labels[priority] ?? priority;
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export function hoursUntil(date: Date | string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 36e5);
}
