import "reflect-metadata";
import { redirect } from "next/navigation";
import { Role, SessaoRemotaStatus } from "@/types";
import { TerminalManager } from "@/components/terminal-manager";
import { initializeDatabase, getRepository } from "@/lib/database";
import { getSession } from "@/lib/auth";
import { Terminal } from "@/entities/Terminal";
import { SessaoRemota } from "@/entities/SessaoRemota";

export default async function TerminaisPage() {
  await initializeDatabase();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== Role.TECNICO && session.role !== Role.ADMIN) redirect("/tickets");

  const terminalRepository = getRepository(Terminal);
  const terminais = await terminalRepository.find({
    relations: ["sessoesRemotas", "sessoesRemotas.usuario"],
    order: { status: "ASC", nome: "ASC" },
    take: 100,
  });

  const terminaisComSessoes = terminais.map((terminal) => ({
    ...terminal,
    sessoesRemotas: terminal.sessoesRemotas
      .filter((sessao: SessaoRemota) =>
        [SessaoRemotaStatus.AGUARDANDO, SessaoRemotaStatus.CONECTANDO, SessaoRemotaStatus.ATIVA].includes(sessao.status)
      )
      .sort((a: SessaoRemota, b: SessaoRemota) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 1)
      .map((sessao: SessaoRemota) => ({
        ...sessao,
        usuario: sessao.usuario ? { id: sessao.usuario.id, name: sessao.usuario.name } : null,
      })),
  }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Acesso remoto</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Terminais</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gerencie agentes desktop, acompanhe presença em tempo real e inicie sessões remotas.
          </p>
        </div>
        <TerminalManager initialTerminais={JSON.parse(JSON.stringify(terminaisComSessoes))} />
    </div>
  );
}
