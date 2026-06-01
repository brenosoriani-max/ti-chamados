import { prisma } from "@/lib/prisma";
import { calculateDueDates } from "@/lib/sla";
import type { Priority } from "@prisma/client";

export async function nextTicketNumber() {
  const year = new Date().getFullYear();
  const total = await prisma.ticket.count({
    where: { number: { startsWith: `CH-${year}-` } }
  });
  return `CH-${year}-${String(total + 1).padStart(4, "0")}`;
}

export async function getDueDates(priority: Priority) {
  const sla = await prisma.sLA.findUnique({ where: { priority } });
  return calculateDueDates(priority, sla);
}
