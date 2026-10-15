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
import { ticketCreateSchema, registerSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";
import { ensureUserTerminal } from "@/lib/remote/services/terminal-service";
import { emitTerminalUpdated } from "@/lib/remote/socket-bridge";
import { messages } from "@/lib/messages";

type RegisterState = { error?: string };

export async function registerAction(_previousState: RegisterState, formData: FormData): Promise<RegisterState> {
  await initializeDatabase();
  
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Revise seus dados e preencha todos os campos corretamente." };
  }

  const { name, email, password } = parsed.data;

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const userAgent = headersList.get("user-agent");

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const userRepository = getRepository(User);
  const equipmentRepository = getRepository(Equipment);

  let user: User;
  try {
    user = userRepository.create({
      name,
      email,
      passwordHash: hashedPassword,
      role: Role.CLIENTE,
      isActive: true,
      lastIp: ip,
    });
    await userRepository.save(user);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
      return { error: "Já existe uma conta cadastrada com este e-mail." };
    }
    console.error("Falha ao cadastrar usuário:", error);
    return { error: "Não foi possível criar sua conta. Tente novamente." };
  }

  const equipment = await equipmentRepository.findOne({
    where: { ipAddress: ip },
  });

  if (equipment) {
    equipment.responsibleUserId = user.id;
    await equipmentRepository.save(equipment);
  }

  const { terminal } = await ensureUserTerminal({
    userId: user.id,
    userName: user.name,
    email: user.email,
    ip,
    userAgent,
  });

  emitTerminalUpdated({
    id: terminal.id,
    nome: terminal.nome,
    status: terminal.status,
    ultimaConexao: terminal.ultimaConexao?.toISOString(),
    ip: terminal.ip,
    usuarioLogado: terminal.usuarioLogado,
    versaoAgente: terminal.versaoAgente,
    sistemaOperacional: terminal.sistemaOperacional,
    hostname: terminal.hostname,
  });

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

type CreateTicketState = { error?: string };

export async function createTicketAction(_previousState: CreateTicketState, formData: FormData): Promise<CreateTicketState> {
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

  const parsed = ticketCreateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    subCategoryId: formData.get("subCategoryId") || undefined,
    priority: (formData.get("priority") as string) || "MEDIA",
    tags: parsedTags,
  });

  if (!parsed.success) {
    return { error: "Preencha o resumo, os detalhes (mínimo de 10 caracteres) e a área afetada." };
  }

  const dueDates = await getDueDates(parsed.data.priority);
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = ticketRepository.create({
    protocolo: await nextTicketNumber(),
    titulo: parsed.data.title,
    descricao: parsed.data.description,
    categoryId: parsed.data.categoryId,
    subCategoryId: parsed.data.subCategoryId || undefined,
    prioridade: parsed.data.priority,
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
    return { success: false, message: messages.users.noPermission };
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

    await ensureUserTerminal({
      userId: user.id,
      userName: user.name,
      email: user.email,
      online: false,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/usuarios");
    revalidatePath("/terminais");

    return { success: true, message: messages.users.createSuccess };
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return { success: false, message: "Já existe um usuário com este e-mail. Use outro e-mail." };
    }
    return { success: false, message: messages.users.createError };
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
