import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { SessaoRemota } from "@/entities/SessaoRemota";

export async function GET(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  await initializeDatabase();

  const { searchParams } = new URL(request.url);
  const terminalId = searchParams.get("terminalId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  const sessaoRepository = getRepository(SessaoRemota);
  const qb = sessaoRepository
    .createQueryBuilder("sessao")
    .leftJoinAndSelect("sessao.terminal", "terminal")
    .leftJoinAndSelect("sessao.usuario", "usuario")
    .orderBy("sessao.createdAt", "DESC")
    .take(100);

  if (terminalId) {
    qb.andWhere("sessao.terminalId = :terminalId", { terminalId });
  }

  if (status) {
    qb.andWhere("sessao.status = :status", { status });
  }

  const sessoes = await qb.getMany();
  return NextResponse.json({ sessoes });
}
