import "reflect-metadata";
import { LessThanOrEqual } from "typeorm";
import { getRepository, initializeDatabase } from "@/lib/database";
import { Ticket } from "@/entities/Ticket";
import { TicketHistory } from "@/entities/TicketHistory";
import { HistoryAction, TicketStatus } from "@/types";

const RESOLVED_ARCHIVE_DELAY_MS = 24 * 60 * 60 * 1000;
let isArchiving = false;

/** Arquiva chamados que permaneceram resolvidos por 24 horas. */
export async function archiveResolvedTickets() {
  if (isArchiving) return 0;
  isArchiving = true;

  try {
    await initializeDatabase();
    const cutoff = new Date(Date.now() - RESOLVED_ARCHIVE_DELAY_MS);
    const ticketRepository = getRepository(Ticket);
    const historyRepository = getRepository(TicketHistory);
    const tickets = await ticketRepository.find({
      where: {
        status: TicketStatus.RESOLVIDO,
        isArchived: false,
        resolvedAt: LessThanOrEqual(cutoff),
      },
      select: ["id"],
    });

    for (const ticket of tickets) {
      const result = await ticketRepository.update(
        { id: ticket.id, isArchived: false },
        { isArchived: true }
      );
      if (!result.affected) continue;

      await historyRepository.save(historyRepository.create({
        ticketId: ticket.id,
        action: HistoryAction.ALTERACAO,
        toValue: "ARQUIVADO AUTOMATICAMENTE APÓS 24 HORAS RESOLVIDO",
      }));
    }

    return tickets.length;
  } catch (error) {
    console.error("Falha ao arquivar chamados resolvidos automaticamente:", error);
    return 0;
  } finally {
    isArchiving = false;
  }
}
