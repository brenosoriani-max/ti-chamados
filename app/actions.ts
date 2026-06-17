"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { getSession, clearAuthCookie, setAuthCookie, createSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketCreateSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashedPassword,
      role: Role.CLIENTE,
      isActive: true,
      lastIp: ip,
    }
  });

  // Automatically try to find and link equipment by IP
  const equipment = await prisma.equipment.findFirst({
    where: { ipAddress: ip }
  });

  if (equipment) {
    await prisma.equipment.update({
      where: { id: equipment.id },
      data: { responsibleUserId: user.id }
    });
  }

  const token = await createSessionToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  await setAuthCookie(token);
  
  redirect("/cliente");
}


export async function logoutAction() {
  await clearAuthCookie();
  redirect("/login");
}

export async function createTicketAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.CLIENTE && session.role !== Role.ADMIN) throw new Error("Sem permissao");

  const parsed = ticketCreateSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    subCategoryId: formData.get("subCategoryId") || undefined,
    priority: formData.get("priority") || "MEDIA",
    tags: String(formData.get("tags") ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  });

  const dueDates = await getDueDates(parsed.priority);
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

  const ticket = await prisma.ticket.create({
    data: {
      ...parsed,
      number: await nextTicketNumber(),
      customerId: session.id,
      creatorIp: ip,
      ...dueDates,
      history: { create: { actorId: session.id, action: "CRIACAO", toValue: "ABERTO" } }
    }
  });

  revalidatePath("/cliente");
  redirect(`/tickets/${ticket.id}`);
}

export async function createUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) throw new Error("Sem permissao");

  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const role = formData.get("role") as Role;
  const password = String(formData.get("password") || "ti123456");

  await prisma.user.create({
    data: { name, email, role, passwordHash: password, isActive: true }
  });

  revalidatePath("/admin");
}

export async function updateTicketStatusAction(ticketId: string, newStatus: string) {
  const session = await getSession();
  if (!session || (session.role !== Role.TECNICO && session.role !== Role.ADMIN)) {
    throw new Error("Sem permissao");
  }

  const oldTicket = await prisma.ticket.findUnique({ where: { id: ticketId }, select: { status: true } });
  
  await prisma.ticket.update({
    where: { id: ticketId },
    data: { 
      status: newStatus as any,
      history: { 
        create: { 
          actorId: session.id, 
          action: "MUDANCA_STATUS", 
          fromValue: oldTicket?.status,
          toValue: newStatus 
        } 
      }
    }
  });

  revalidatePath("/suporte");
}

export async function assignTicketAction(ticketId: string, assigneeId: string) {
  const session = await getSession();
  if (!session || session.role !== Role.ADMIN) throw new Error("Sem permissao");

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { 
      assigneeId: assigneeId || null,
      status: assigneeId ? "EM_ATENDIMENTO" : "ABERTO",
      history: { create: { actorId: session.id, action: "TROCA_RESPONSAVEL", toValue: assigneeId || "Nenhum" } }
    }
  });

  revalidatePath("/suporte");
}

export async function archiveTicketAction(ticketId: string, isArchived: boolean) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const isOwner = ticket.customerId === session.id;
  const isStaff = session.role === Role.TECNICO || session.role === Role.ADMIN;

  if (!isOwner && !isStaff) {
    throw new Error("Sem permissão");
  }

  await prisma.ticket.update({
    where: { id: ticketId },
    data: { 
      isArchived: isArchived as any,
      history: { 
        create: { 
          actorId: session.id, 
          action: "ALTERACAO", 
          toValue: isArchived ? "ARQUIVADO" : "RESTAURADO" 
        } 
      }
    }
  });

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath("/cliente");
}

export async function deleteTicketAction(ticketId: string) {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado");

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("Chamado não encontrado");

  const isOwner = ticket.customerId === session.id;
  const isStaff = session.role === Role.TECNICO || session.role === Role.ADMIN;

  // For deletion, maybe only allow if it's archived or if staff
  if (!isOwner && !isStaff) {
    throw new Error("Sem permissão");
  }

  await prisma.ticket.delete({
    where: { id: ticketId }
  });

  revalidatePath("/suporte");
  revalidatePath("/tickets");
  revalidatePath("/cliente");
}
