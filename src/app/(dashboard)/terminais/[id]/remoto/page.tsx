import "reflect-metadata";
import { redirect } from "next/navigation";
import { Role } from "@/types";
import { initializeDatabase } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { resolveRemoteSessionTarget } from "@/lib/meshcentral";

export default async function RemoteTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  await initializeDatabase();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/tickets");

  const { id } = await params;

  try {
    const target = await resolveRemoteSessionTarget(id);
    redirect(target.sessionUrl);
  } catch {
    redirect("/terminais");
  }
}
