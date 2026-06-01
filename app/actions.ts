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
