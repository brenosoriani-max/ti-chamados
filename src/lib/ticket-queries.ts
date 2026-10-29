import "reflect-metadata";
import { Brackets } from "typeorm";
import { Ticket } from "@/entities/Ticket";
import { getRepository } from "@/lib/database";

export type TicketFilter = {
  isArchived?: boolean;
  clienteId?: string;
  assigneeId?: string | null;
  status?: string;
  priority?: string;
  q?: string;
};

export function mapTicketListItem(ticket: Ticket) {
  return {
    id: ticket.id,
    number: ticket.protocolo,
    title: ticket.titulo,
    status: ticket.status,
    priority: ticket.prioridade,
    isArchived: ticket.isArchived,
    customerId: ticket.clienteId,
    assigneeId: ticket.responsavelId ?? null,
    assigneeName: ticket.responsavel?.name ?? "Nenhum",
    slaDueAt: ticket.slaDueAt,
    updatedAt: ticket.updatedAt,
    createdAt: ticket.createdAt,
    category: ticket.category ? { name: ticket.category.name } : null,
    customer: ticket.cliente ? { name: ticket.cliente.name } : { name: "—" },
    equipment: ticket.equipment
      ? {
          id: ticket.equipment.id,
          machineName: ticket.equipment.machineName,
          hostname: ticket.equipment.hostname,
          ipAddress: ticket.equipment.ipAddress,
        }
      : null,
  };
}

export function buildTicketQuery(filter: TicketFilter) {
  const repo = getRepository(Ticket);
  const qb = repo
    .createQueryBuilder("ticket")
    .leftJoin("ticket.cliente", "cliente")
    .leftJoin("ticket.responsavel", "responsavel")
    .leftJoin("ticket.category", "category")
    .leftJoin("ticket.equipment", "equipment")
    .addSelect([
      "cliente.id",
      "cliente.name",
      "responsavel.id",
      "responsavel.name",
      "category.id",
      "category.name",
      "equipment.id",
      "equipment.machineName",
      "equipment.hostname",
      "equipment.ipAddress",
    ]);

  if (filter.isArchived !== undefined) {
    qb.andWhere("ticket.isArchived = :isArchived", { isArchived: filter.isArchived });
  }

  if (filter.clienteId) {
    qb.andWhere("ticket.clienteId = :clienteId", { clienteId: filter.clienteId });
  }

  if (filter.assigneeId !== undefined) {
    qb.andWhere("ticket.responsavelId = :assigneeId", { assigneeId: filter.assigneeId || null });
  }

  if (filter.status) {
    qb.andWhere("ticket.status = :status", { status: filter.status });
  }

  if (filter.priority) {
    qb.andWhere("ticket.prioridade = :priority", { priority: filter.priority });
  }

  if (filter.q) {
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where("ticket.titulo LIKE :q", { q: `%${filter.q}%` })
          .orWhere("ticket.protocolo LIKE :q", { q: `%${filter.q}%` });
      })
    );
  }

  return qb;
}

export async function findTicketsWithRelations(filter: TicketFilter) {
  const tickets = await buildTicketQuery(filter)
    .orderBy("ticket.updatedAt", "DESC")
    .getMany();

  return tickets.map(mapTicketListItem);
}

export async function countTickets(filter: TicketFilter) {
  const repo = getRepository(Ticket);
  const qb = repo.createQueryBuilder("ticket");

  if (filter.isArchived !== undefined) {
    qb.andWhere("ticket.isArchived = :isArchived", { isArchived: filter.isArchived });
  }

  if (filter.clienteId) {
    qb.andWhere("ticket.clienteId = :clienteId", { clienteId: filter.clienteId });
  }

  if (filter.assigneeId !== undefined) {
    qb.andWhere("ticket.responsavelId = :assigneeId", { assigneeId: filter.assigneeId || null });
  }

  if (filter.status) {
    qb.andWhere("ticket.status = :status", { status: filter.status });
  }

  if (filter.priority) {
    qb.andWhere("ticket.prioridade = :priority", { priority: filter.priority });
  }

  if (filter.q) {
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where("ticket.titulo LIKE :q", { q: `%${filter.q}%` })
          .orWhere("ticket.protocolo LIKE :q", { q: `%${filter.q}%` });
      })
    );
  }

  return qb.getCount();
}
