import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { AppShell } from "@/components/app-shell";
import { RemoteSessionViewer } from "@/components/remote-session-viewer";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function RemoteTerminalPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/tickets");

  const { id } = await params;
  const terminal = await prisma.terminal.findUnique({ where: { id } });

  if (!terminal) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Terminal nao encontrado.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <RemoteSessionViewer terminal={JSON.parse(JSON.stringify(terminal))} />
    </AppShell>
  );
}
