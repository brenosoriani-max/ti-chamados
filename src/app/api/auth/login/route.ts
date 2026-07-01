import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDataSource } from "@/lib/db";
import { User } from "@/entities/User";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { Role } from "@/types";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  const body = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries((await request.formData()).entries());

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados de login inválidos" }, { status: 400 });
  }

  // Find user by email using TypeORM
  const ds = await getDataSource();
  const userRepo = ds.getRepository(User);
  const user = await userRepo.findOne({
    where: { email: parsed.data.email },
  });

  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 401 }
    );
  }

  // Verify password
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

  // Create session token and set cookie
  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  // Update user last IP
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : request.nextUrl.hostname;

  user.lastIp = ip;
  await userRepo.save(user);

  await setAuthCookie(token);

  // Return based on content type
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

  // Redirect to dashboard based on user role
  const redirectUrl =
    user.role === Role.CLIENTE
      ? "/cliente"
      : user.role === Role.ADMINISTRADOR
      ? "/admin"
      : "/suporte";

  return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
}
