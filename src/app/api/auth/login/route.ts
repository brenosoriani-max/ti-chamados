import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { initializeDatabase, getRepository } from "@/lib/database";
import { User } from "@/entities/User";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { Role } from "@/types";

export async function POST(request: NextRequest) {
  await initializeDatabase();
  
  const contentType = request.headers.get("content-type") ?? "";

  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de login inválidos" }, { status: 400 });
  }

  const userRepository = getRepository(User);
  const user = await userRepository.findOne({
    where: { email: parsed.data.email },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  const passwordMatch = await bcrypt.compare(
    parsed.data.password,
    user.passwordHash
  );

  if (!passwordMatch) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
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
  const ip = forwarded ? forwarded.split(",")[0] : request.nextUrl.hostname;

  user.lastIp = ip;
  await userRepository.save(user);

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
