import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { TerminalManager } from "@/components/terminal-manager";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export default async function TerminaisPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/tickets");

  const terminais = await prisma.terminal.findMany({
    orderBy: [{ status: "asc" }, { nome: "asc" }],
    take: 100,
    include: {
      sessoesRemotas: {
        where: { status: { in: ["AGUARDANDO", "CONECTANDO", "ATIVA"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { usuario: { select: { id: true, name: true } } },
      },
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Acesso remoto</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Terminais</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie agentes desktop, acompanhe presença em tempo real e inicie sessões remotas.
          </p>
        </div>
        <TerminalManager initialTerminais={JSON.parse(JSON.stringify(terminais))} />
    </div>
  );
}
