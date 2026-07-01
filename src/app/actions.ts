"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { getSession, clearRefreshCookie, setAuthCookie, createSessionToken } from "@/lib/auth";
import { getDataSource } from "@/lib/db";
import { User } from "@/entities/User";
import { Ticket } from "@/entities/Ticket";
import { TicketHistory } from "@/entities/TicketHistory";
import { Equipment } from "@/entities/Equipment";
import { Role, TicketStatus, HistoryAction } from "@/types";
import { ticketCreateSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = await bcrypt.hashSync(password, salt);

  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const equipmentRepo = ds.getRepository(Equipment);

  const newUser = userRepo.create({
    name,
    email,
    passwordHash: hashedPassword,
    role: Role.CLIENTE,
    isActive: true,
    lastIp: ip,
  });

  const user = await userRepo.save(newUser);

  // Automatically try to find and link equipment by IP
  const equipment = await equipmentRepo.findOne({
    where: { ipAddress: ip },
  });

  if (equipment) {
    equipment.responsibleUserId = user.id;
    await equipmentRepo.save(equipment);
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  await setAuthCookie(token);

  redirect("/cliente");
}

export async function logoutAction() {
  await clearRefreshCookie();
  redirect("/login");
}

export async function createTicketAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMINISTRADOR) {
    throw new Error("Sem permissao");
  }

  // Parse tags
  const tagsText = String(formData.get("tags") ?? "");
  const parsedTags = tagsText
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const parsed = ticketCreateSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    subCategoryId: formData.get("subCategoryId") || undefined,
    priority: formData.get("priority") || "MEDIA",
    tags: parsedTags,
  });

  const dueDates = await getDueDates(parsed.priority);
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);
  const historyRepo = ds.getRepository(TicketHistory);

  const num = await nextTicketNumber();

  const newTicket = ticketRepo.create({
    titulo: parsed.title,
    descricao: parsed.description,
    categoryId: parsed.categoryId,
    subCategoryId: parsed.subCategoryId || undefined,
    prioridade: parsed.priority,
    status: TicketStatus.ABERTO,
    protocolo: num,
    clienteId: session.id,
    creatorIp: ip,
    slaDueAt: dueDates.slaDueAt,
    responseDueAt: dueDates.responseDueAt,
    isArchived: false,
  });

  const ticket = await ticketRepo.save(newTicket);

  // Add history action
  const history = historyRepo.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.CRIACAO,
    toValue: TicketStatus.ABERTO,
  });
  await historyRepo.save(history);

  revalidatePath("/cliente");
  redirect(`/tickets/${ticket.id}`);
}

export async function createUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMINISTRADOR) throw new Error("Sem permissao");

  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const role = formData.get("role") as Role;
  const password = String(formData.get("password") || "ti123456");

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);

  const user = userRepo.create({
    name,
    email,
    role,
    passwordHash: hashedPassword,
    isActive: true,
  });

  await userRepo.save(user);

  revalidatePath("/admin");
}

export async function updateTicketStatusAction(ticketId: string, newStatus: string) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== Role.OPERADOR &&
      session.role !== Role.SUPERVISOR &&
      session.role !== Role.ADMINISTRADOR)
  ) {
    throw new Error("Sem permissao");
  }

  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);
  const historyRepo = ds.getRepository(TicketHistory);

  const ticket = await ticketRepo.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const oldStatus = ticket.status;
  ticket.status = newStatus as TicketStatus;

  if (newStatus === TicketStatus.RESOLVIDO) {
    ticket.resolvedAt = new Date();
  } else if (newStatus === TicketStatus.FECHADO) {
    ticket.closedAt = new Date();
    ticket.dataFechamento = new Date();
  }

  await ticketRepo.save(ticket);

  const history = historyRepo.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.MUDANCA_STATUS,
    fromValue: oldStatus,
    toValue: newStatus,
  });
  await historyRepo.save(history);

  revalidatePath("/suporte");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function assignTicketAction(ticketId: string, assigneeId: string) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== Role.SUPERVISOR && session.role !== Role.ADMINISTRADOR)
  ) {
    throw new Error("Sem permissao");
  }

  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);
  const historyRepo = ds.getRepository(TicketHistory);

  const ticket = await ticketRepo.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  ticket.responsavelId = assigneeId || undefined;
  ticket.status = assigneeId ? TicketStatus.EM_ANDAMENTO : TicketStatus.ABERTO;

  await ticketRepo.save(ticket);

  const history = historyRepo.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.TROCA_RESPONSAVEL,
    toValue: assigneeId || "Nenhum",
  });
  await historyRepo.save(history);

  revalidatePath("/suporte");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function archiveTicketAction(ticketId: string, isArchived: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);
  const historyRepo = ds.getRepository(TicketHistory);

  const ticket = await ticketRepo.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const isOwner = ticket.clienteId === session.id;
  const isStaff =
    session.role === Role.OPERADOR ||
    session.role === Role.SUPERVISOR ||
    session.role === Role.ADMINISTRADOR;

  if (!isOwner && !isStaff) {
    throw new Error("Sem permissão");
  }

  ticket.isArchived = isArchived;
  await ticketRepo.save(ticket);

  const history = historyRepo.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.ALTERACAO,
    toValue: isArchived ? "ARQUIVADO" : "RESTAURADO",
  });
  await historyRepo.save(history);

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath("/cliente");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function deleteTicketAction(ticketId: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const ds = await getDataSource();
  const ticketRepo = ds.getRepository(Ticket);

  const ticket = await ticketRepo.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const isOwner = ticket.clienteId === session.id;
  const isStaff =
    session.role === Role.OPERADOR ||
    session.role === Role.SUPERVISOR ||
    session.role === Role.ADMINISTRADOR;

  if (!isOwner && !isStaff) {
    throw new Error("Sem permissão");
  }

  await ticketRepo.softRemove(ticket); // Use soft delete!

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath("/cliente");
}
