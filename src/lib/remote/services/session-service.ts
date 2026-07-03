import "reflect-metadata";
import { getRepository, initializeDatabase } from "@/lib/database";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { SessaoRemotaStatus } from "@/types";
import { appendRemoteLog } from "@/lib/remote-logs";

export async function updateSessionStatus(
  sessaoId: string,
  status: SessaoRemotaStatus,
  extra?: { iniciadaEm?: Date; encerradaEm?: Date; log?: Record<string, unknown> }
) {
  await initializeDatabase();
  const repo = getRepository(SessaoRemota);
  const sessao = await repo.findOne({ where: { id: sessaoId } });
  if (!sessao) return null;

  sessao.status = status;
  if (extra?.iniciadaEm) sessao.iniciadaEm = extra.iniciadaEm;
  if (extra?.encerradaEm) sessao.encerradaEm = extra.encerradaEm;
  if (extra?.log) {
    sessao.logs = appendRemoteLog(sessao.logs, extra.log);
  }

  await repo.save(sessao);
  return sessao;
}

export async function findSession(sessaoId: string) {
  await initializeDatabase();
  return getRepository(SessaoRemota).findOne({
    where: { id: sessaoId },
    relations: ["terminal", "usuario"],
  });
}
