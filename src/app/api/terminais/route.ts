import "reflect-metadata";
import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Role, SessaoRemotaStatus } from "@/types";
import { initializeDatabase, getRepository } from "@/lib/database";
import { requireSession } from "@/lib/auth";
import { terminalCreateSchema } from "@/lib/validators";
import { Terminal } from "@/entities/Terminal";
import { SessaoRemota } from "@/entities/SessaoRemota";
import { Brackets } from "typeorm";

export async function GET(request: NextRequest) {
  await requireSession();
  await initializeDatabase();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "50")));
  const query = searchParams.get("q")?.trim();

  const terminalRepository = getRepository(Terminal);
  const qb = terminalRepository
    .createQueryBuilder("terminal")
    .leftJoinAndSelect("terminal.sessoesRemotas", "sessao")
    .leftJoinAndSelect("sessao.usuario", "usuario");

  if (query) {
    qb.andWhere(
      new Brackets((sub) => {
        sub
          .where("terminal.nome LIKE :query", { query: `%${query}%` })
          .orWhere("terminal.identificador LIKE :query", { query: `%${query}%` })
          .orWhere("terminal.sistemaOperacional LIKE :query", { query: `%${query}%` })
          .orWhere("terminal.ip LIKE :query", { query: `%${query}%` });
      })
    );
  }

  const [terminais, total] = await qb
    .orderBy("terminal.status", "ASC")
    .addOrderBy("terminal.nome", "ASC")
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getManyAndCount();

  const formatted = terminais.map((terminal) => ({
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

  return NextResponse.json({ terminais: formatted, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);
  await initializeDatabase();

  const body = await request.json();
  const parsed = terminalCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados do terminal invalidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const terminalRepository = getRepository(Terminal);
  const terminal = terminalRepository.create({
    nome: parsed.data.nome,
    identificador: parsed.data.identificador,
    token: parsed.data.token ?? randomBytes(32).toString("hex"),
    descricao: parsed.data.descricao ?? undefined,
    empresaId: parsed.data.empresaId ?? undefined,
    status: parsed.data.status,
    ultimaConexao: parsed.data.ultimaConexao ?? undefined,
    sistemaOperacional: parsed.data.sistemaOperacional ?? undefined,
    ip: parsed.data.ip ?? undefined,
    versaoAgente: parsed.data.versaoAgente ?? undefined,
  });
  await terminalRepository.save(terminal);

  return NextResponse.json(terminal, { status: 201 });
}
