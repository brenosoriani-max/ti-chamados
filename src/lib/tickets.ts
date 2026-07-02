import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { Ticket } from "@/entities/Ticket";
import { SLA } from "@/entities/SLA";
import { calculateDueDates } from "@/lib/sla";
import { Priority } from "@/types";

export async function nextTicketNumber() {
  await initializeDatabase();
  const ticketRepository = getRepository(Ticket);
  const total = await ticketRepository.count();
  return `HD-${String(total + 1).padStart(6, "0")}`;
}

export async function getDueDates(priority: Priority) {
  await initializeDatabase();
  const slaRepository = getRepository(SLA);
  const sla = await slaRepository.findOne({ where: { priority } });
  return calculateDueDates(
    priority,
    sla ? { responseHours: sla.responseHours, solutionHours: sla.solutionHours } : null
  );
}
