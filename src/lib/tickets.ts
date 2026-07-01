import { getDataSource } from "@/lib/db";
import { Ticket } from "@/entities/Ticket";
import { SLA } from "@/entities/SLA";
import { calculateDueDates } from "@/lib/sla";
import { Priority } from "@/types";

export async function nextTicketNumber() {
  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);
  const total = await ticketRepo.count();
  return `HD-${String(total + 1).padStart(6, "0")}`;
}

export async function getDueDates(priority: Priority) {
  const ds = await getDataSource();
  const slaRepo = ds.getRepository(SLA);
  const sla = await slaRepo.findOne({ where: { priority } });
  return calculateDueDates(priority, sla);
}
