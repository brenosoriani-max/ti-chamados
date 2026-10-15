import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Role } from "@/types";

export default async function Home() {
  const session = await getSession();

  if (!session) redirect("/login");

  // A fila mantém seu Kanban visível mesmo quando não há chamados.
  // Clientes continuam no fluxo de abertura, que não expõe a fila interna de suporte.
  if (session.role === Role.TECNICO || session.role === Role.ADMIN) {
    redirect("/suporte");
  }

  redirect("/cliente");
}
