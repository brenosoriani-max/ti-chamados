"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketCreateSchema } from "@/lib/validators";
import { getDueDates, nextTicketNumber } from "@/lib/tickets";

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
  const ticket = await prisma.ticket.create({
    data: {
      ...parsed,
      number: await nextTicketNumber(),
      customerId: session.id,
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
