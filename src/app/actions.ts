"use server";

import "reflect-metadata";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
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
import { TicketAttachment } from "@/entities/TicketAttachment";
import { KnowledgeArticle } from "@/entities/KnowledgeArticle";
import { Category } from "@/entities/Category";
import { Role, TicketStatus, HistoryAction } from "@/types";
import { ticketCreateSchema, ticketFinishSchema, ticketTransferSchema, registerSchema } from "@/lib/validators";
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

const MAX_TICKET_IMAGES = 3;
const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

function imageExtension(mimeType: string) {
  return { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" }[mimeType];
}

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

  const images = formData.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);
  if (images.length > MAX_TICKET_IMAGES) {
    return { error: "É permitido anexar no máximo 3 imagens por chamado." };
  }
  if (images.some((image) => !IMAGE_MIME_TYPES.has(image.type) || image.size > MAX_IMAGE_SIZE_BYTES)) {
    return { error: "Envie imagens JPG, PNG, GIF ou WEBP de até 5 MB cada." };
  }

  const dueDates = await getDueDates(parsed.data.priority);
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);
  const ticketAttachmentRepository = getRepository(TicketAttachment);

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

  if (images.length > 0) {
    const uploadDirectory = path.join(process.cwd(), "public", "uploads", "tickets", ticket.id);
    await mkdir(uploadDirectory, { recursive: true });

    const attachments = await Promise.all(images.map(async (image) => {
      const fileName = `${randomUUID()}.${imageExtension(image.type)}`;
      await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await image.arrayBuffer()));
      return ticketAttachmentRepository.create({
        ticketId: ticket.id,
        fileName: image.name.slice(0, 255),
        fileUrl: `/uploads/tickets/${ticket.id}/${fileName}`,
        fileType: image.type,
        fileSize: image.size,
      });
    }));
    await ticketAttachmentRepository.save(attachments);
  }

  const history = ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.CRIACAO,
    toValue: TicketStatus.ABERTO,
  });
  await ticketHistoryRepository.save(history);

  if (images.length > 0) {
    await ticketHistoryRepository.save(ticketHistoryRepository.create({
      ticketId: ticket.id,
      actorId: session.id,
      action: HistoryAction.UPLOAD_ARQUIVO,
      toValue: `${images.length} ${images.length === 1 ? "imagem anexada" : "imagens anexadas"}`,
    }));
  }

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

export async function reopenTicketAction(ticketId: string) {
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

  if (![TicketStatus.RESOLVIDO, TicketStatus.ENCERRADO, TicketStatus.CANCELADO].includes(ticket.status)) {
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.ABERTO;
  ticket.resolvedAt = undefined;
  ticket.closedAt = undefined;
  await ticketRepository.save(ticket);

  await ticketHistoryRepository.save(ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.MUDANCA_STATUS,
    fromValue: oldStatus,
    toValue: TicketStatus.ABERTO,
  }));

  revalidatePath("/tickets");
  revalidatePath("/cliente");
  revalidatePath("/suporte");
  revalidatePath(`/tickets/${ticketId}`);
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
    ticket.closedAt = undefined;
  } else if (newStatus === TicketStatus.ENCERRADO) {
    ticket.closedAt = new Date();
    ticket.resolvedAt = undefined;
  } else if (newStatus === TicketStatus.ABERTO) {
    ticket.resolvedAt = undefined;
    ticket.closedAt = undefined;
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
  revalidatePath("/tickets");
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

export async function finishTicketAction(ticketId: string, conclusion: string) {
  await initializeDatabase();

  const session = await getSession();
  if (!session || (session.role !== Role.TECNICO && session.role !== Role.ADMIN)) {
    throw new Error("Sem permissao");
  }

  const parsed = ticketFinishSchema.safeParse({ conclusion });
  if (!parsed.success) {
    throw new Error("Informe a conclusão do atendimento com pelo menos 10 caracteres.");
  }

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const oldStatus = ticket.status;
  ticket.status = TicketStatus.RESOLVIDO;
  ticket.conclusaoAtendimento = parsed.data.conclusion.trim();
  ticket.resolvedAt = new Date();
  ticket.closedAt = undefined;
  ticket.updatedAt = new Date();
  await ticketRepository.save(ticket);

  await ticketHistoryRepository.save(ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.FINALIZACAO,
    fromValue: oldStatus,
    toValue: TicketStatus.RESOLVIDO,
    metadata: parsed.data.conclusion.trim(),
  }));

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function transferTicketAction(ticketId: string, transferToUserId: string, transferReason: string) {
  await initializeDatabase();

  const session = await getSession();
  if (!session || (session.role !== Role.TECNICO && session.role !== Role.ADMIN)) {
    throw new Error("Sem permissao");
  }

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const parsed = ticketTransferSchema.safeParse({ transferToUserId, transferReason });
  if (!parsed.success) {
    throw new Error("É obrigatório informar o técnico e o motivo da transferência.");
  }

  ticket.transferredFromUserId = ticket.responsavelId ?? session.id;
  ticket.transferredToUserId = parsed.data.transferToUserId;
  ticket.transferReason = parsed.data.transferReason.trim();
  ticket.responsavelId = parsed.data.transferToUserId;
  ticket.status = TicketStatus.EM_ATENDIMENTO;
  await ticketRepository.save(ticket);

  await ticketHistoryRepository.save(ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.TROCA_RESPONSAVEL,
    fromValue: ticket.transferredFromUserId,
    toValue: parsed.data.transferToUserId,
    metadata: parsed.data.transferReason.trim(),
  }));

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}

export async function acceptTicketAction(ticketId: string) {
  await initializeDatabase();

  const session = await getSession();
  if (!session || (session.role !== Role.TECNICO && session.role !== Role.ADMIN)) {
    throw new Error("Sem permissao");
  }

  const ticketRepository = getRepository(Ticket);
  const ticketHistoryRepository = getRepository(TicketHistory);

  const ticket = await ticketRepository.findOne({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  if (ticket.responsavelId && ticket.responsavelId !== session.id) {
    throw new Error("Este chamado já está atribuído a outro técnico.");
  }

  const previousAssignee = ticket.responsavelId ?? null;
  ticket.responsavelId = session.id;
  ticket.status = TicketStatus.EM_ATENDIMENTO;
  await ticketRepository.save(ticket);

  await ticketHistoryRepository.save(ticketHistoryRepository.create({
    ticketId: ticket.id,
    actorId: session.id,
    action: HistoryAction.TROCA_RESPONSAVEL,
    fromValue: previousAssignee ?? "Nenhum",
    toValue: session.id,
  }));

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${ticketId}`);
}
