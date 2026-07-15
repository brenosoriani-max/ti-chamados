import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { Role } from "@/types";
import { ensureUserTerminal } from "@/lib/remote/services/terminal-service";
import { emitTerminalUpdated } from "@/lib/remote/socket-bridge";
import { messages } from "@/lib/messages";

export async function POST(request: NextRequest) {
  await initializeDatabase();
  
  const contentType = request.headers.get("content-type") ?? "";

  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: messages.auth.invalidData }, { status: 400 });
  }

  const userRepository = getRepository(User);
  const user = await userRepository.findOne({
    where: { email: parsed.data.email },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: user && !user.isActive ? messages.auth.inactiveUser : messages.auth.invalidLogin },
      { status: 401 }
    );
  }

  const passwordMatch = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordMatch) {
    return NextResponse.json(
      { error: messages.auth.invalidLogin },
      { status: 401 }
    );
  }

  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  });

  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip"))?.trim()
    || request.nextUrl.hostname;

  user.lastIp = ip;
  await userRepository.save(user);

  const { terminal } = await ensureUserTerminal({
    userId: user.id,
    userName: user.name,
    email: user.email,
    ip,
    userAgent: request.headers.get("user-agent"),
  });

  emitTerminalUpdated({
    id: terminal.id,
    nome: terminal.nome,
    status: terminal.status,
    ultimaConexao: terminal.ultimaConexao?.toISOString(),
    ip: terminal.ip,
    usuarioLogado: terminal.usuarioLogado,
    versaoAgente: terminal.versaoAgente,
    sistemaOperacional: terminal.sistemaOperacional,
    hostname: terminal.hostname,
  });

  await setAuthCookie(token);

  if (contentType.includes("application/json")) {
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  }

  const redirectUrl =
    user.role === Role.CLIENTE
      ? "/cliente"
      : user.role === Role.ADMIN
      ? "/admin"
      : "/suporte";

  return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
}
