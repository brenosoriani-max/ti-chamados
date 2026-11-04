import "reflect-metadata";
import { initializeDatabase, getRepository } from "@/lib/database";
import { Ticket } from "@/entities/Ticket";
import { SLA } from "@/entities/SLA";
import { calculateDueDates } from "@/lib/sla";
import { Priority } from "@/types";

export async function nextTicketNumber() {
  await initializeDatabase();
  const ticketRepository = getRepository(Ticket);

  const result = await ticketRepository
    .createQueryBuilder("ticket")
    .select("MAX(CAST(REPLACE(ticket.protocolo, 'HD-', '') AS UNSIGNED))", "maxNumero")
    .getRawOne<{ maxNumero?: number | string }>();

  const currentMax = Number(result?.maxNumero ?? 0);
  return `HD-${String(currentMax + 1).padStart(6, "0")}`;
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
