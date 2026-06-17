import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";


export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";


  const body =
    contentType.includes("application/json")
      ? await request.json()
      : Object.fromEntries((await request.formData()).entries());

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Credenciais inválidas" },
      { status: 400 }
    );
  }

  // Find user by email
  const user = await prisma.user.findUnique({
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

  await prisma.user.update({
    where: { id: user.id },
    data: { lastIp: ip },
  });

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
    user.role === "CLIENTE"
      ? "/cliente"
      : user.role === "TECNICO"
        ? "/suporte"
        : "/admin";

  return NextResponse.redirect(new URL(redirectUrl, request.url), 303);
}
