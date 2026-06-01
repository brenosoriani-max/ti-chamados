import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await request.json() : Object.fromEntries((await request.formData()).entries());
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Credenciais invalidas" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.isActive) return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Credenciais invalidas" }, { status: 401 });

  const token = await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  await setAuthCookie(token);

  if (contentType.includes("application/json")) return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  return NextResponse.redirect(new URL(user.role === "CLIENTE" ? "/cliente" : user.role === "TECNICO" ? "/suporte" : "/admin", request.url), 303);
}
