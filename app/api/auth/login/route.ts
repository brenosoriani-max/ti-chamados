import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setAuthCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";

/**
 * POST /api/auth/login
 * Authenticate user and create session
 * Accepts both JSON and form-urlencoded content types
 */
export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  // Parse request body (JSON or form data)
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
