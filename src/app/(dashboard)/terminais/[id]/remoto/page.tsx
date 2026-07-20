import "reflect-metadata";
import { redirect } from "next/navigation";
import { Role } from "@/types";
import { RemoteSessionViewer } from "@/components/remote-session-viewer";
import { initializeDatabase, getRepository } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { Terminal } from "@/entities/Terminal";

export default async function RemoteTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  await initializeDatabase();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/tickets");

  const { id } = await params;
  const terminalRepository = getRepository(Terminal);
  const terminal = await terminalRepository.findOne({ where: { id } });

  if (!terminal) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        Terminal nao encontrado.
      </div>
    );
  }

  return (
    <RemoteSessionViewer terminal={JSON.parse(JSON.stringify(terminal))} />
  );
}
