"use server";

import "reflect-metadata";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { getSession, clearRefreshCookie, setAuthCookie, createSessionToken } from "@/lib/auth";
import { getRepository, initializeDatabase } from "@/lib/database";
import { User } from "@/entities/User";
import { Equipment } from "@/entities/Equipment";
import { Ticket } from "@/entities/Ticket";
import { TicketHistory } from "@/entities/TicketHistory";
import { Role, TicketStatus, HistoryAction } from "@/types";
import { ticketCreateSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";
import { toast } from "sonner";

export async function registerAction(formData: FormData) {
  await initializeDatabase();
  
  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const userRepository = getRepository(User);
  const equipmentRepository = getRepository(Equipment);

  const user = userRepository.create({
    name,
    email,
    passwordHash: hashedPassword,
    role: Role.CLIENTE,
    isActive: true,
    lastIp: ip,
  });
  await userRepository.save(user);

  const equipment = await equipmentRepository.findOne({
    where: { ipAddress: ip },
  });

  if (equipment) {
    equipment.responsibleUserId = user.id;
    await equipmentRepository.save(equipment);
  }

  const token = await createSessionToken({
    id: user.id,
    email: user.email,
    role: user.role as Role,
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
  await initializeDatabase();
  
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) {
    throw new Error("Sem permissao");
  }

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
    priority: (formData.get("priority") as string) || "MEDIA",
    tags: parsedTags,
  });

  const dueDates = await getDueDates(parsed.priority);
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = ticketRepository.create({
    protocolo: await nextTicketNumber(),
    titulo: parsed.title,
    descricao: parsed.description,
    categoryId: parsed.categoryId,
    subCategoryId: parsed.subCategoryId || undefined,
    prioridade: parsed.priority,
    status: TicketStatus.ABERTO,
    clienteId: session.id,
    creatorIp: ip,
    slaDueAt: dueDates.slaDueAt,
    responseDueAt: dueDates.responseDueAt,
    isArchived: false,
  });
  await ticketRepository.save(ticket);

  const history = ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.CRIACAO,
    toValue: TicketStatus.ABERTO,
  });
  await ticketHistoryRepository.save(history);

  revalidatePath("/cliente");
  redirect(`/tickets/${ticket.id}`);
}

export async function createUserAction(formData: FormData) {
  await initializeDatabase();

  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    return { success: false, message: "Sem permissão" };
  }

  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const role = formData.get("role") as Role;
  const password = String(formData.get("password") || "ti123456");

  try {
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const userRepository = getRepository(User);
    const user = userRepository.create({
      name,
      email,
      role,
      passwordHash: hashedPassword,
      isActive: true,
    });
    await userRepository.save(user);

    revalidatePath("/admin");
    revalidatePath("/admin/usuarios");

    return { success: true, message: "Usuário cadastrado com sucesso" };
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return { success: false, message: "Já existe um usuário com esse e-mail" };
    }
    return { success: false, message: "Erro ao cadastrar usuário" };
  }
}

export async function updateTicketStatusAction(ticketId: string, newStatus: string) {
  await initializeDatabase();
  
  const session = await getSession();
  if (
    !session ||
    (session.role !== Role.TECNICO && session.role !== Role.ADMIN)
  ) {
    throw new Error("Sem permissao");
  }

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const oldStatus = ticket.status;

  if (newStatus === TicketStatus.RESOLVIDO) {
    ticket.resolvedAt = new Date();
  } else if (newStatus === TicketStatus.ENCERRADO) {
    ticket.closedAt = new Date();
  }
  ticket.status = newStatus as TicketStatus;
  await ticketRepository.save(ticket);

  const history = ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.MUDANCA_STATUS,
    fromValue: oldStatus,
    toValue: newStatus,
  });
  await ticketHistoryRepository.save(history);

  revalidatePath("/suporte");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function assignTicketAction(ticketId: string, assigneeId: string) {
  await initializeDatabase();
  
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) {
    throw new Error("Sem permissao");
  }

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  ticket.responsavelId = assigneeId || undefined;
  ticket.status = assigneeId ? TicketStatus.EM_ATENDIMENTO : TicketStatus.ABERTO;
  await ticketRepository.save(ticket);

  const history = ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.TROCA_RESPONSAVEL,
    toValue: assigneeId || "Nenhum",
  });
  await ticketHistoryRepository.save(history);

  revalidatePath("/suporte");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function archiveTicketAction(ticketId: string, isArchived: boolean) {
  await initializeDatabase();
  
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const isOwner = ticket.clienteId === session.id;
  const isStaff = session.role === Role.TECNICO || session.role === Role.ADMIN;

  if (!isOwner && !isStaff) {
    throw new Error("Sem permissão");
  }

  ticket.isArchived = isArchived;
  await ticketRepository.save(ticket);

  const history = ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.ALTERACAO,
    toValue: isArchived ? "ARQUIVADO" : "RESTAURADO",
  });
  await ticketHistoryRepository.save(history);

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath("/cliente");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function deleteTicketAction(ticketId: string) {
  await initializeDatabase();
  
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const ticketRepository = getRepository(Ticket);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const isOwner = ticket.clienteId === session.id;
  const isStaff = session.role === Role.TECNICO || session.role === Role.ADMIN;

  if (!isOwner && !isStaff) {
    throw new Error("Sem permissão");
  }

  await ticketRepository.remove(ticket);

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath("/cliente");
}
