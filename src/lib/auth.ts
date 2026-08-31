import "reflect-metadata";
import { cookies } from "next/headers";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { getRepository, initializeDatabase } from "@/lib/database";
import { User } from "@/entities/User";
import { Role } from "@/types";
import { messages } from "@/lib/messages";

const cookieName = "ti_chamados_token";

function secret() {
  const value = process.env.JWT_SECRET;
  const isWeak = !value || value === "abobrinha-frita" || value === "troque-por-um-segredo-longo-em-producao" || value === "dev-secret-change-me";

  if (isWeak && process.env.NODE_ENV === "production") {
    throw new Error("ERRO CRÍTICO DE SEGURANÇA: JWT_SECRET fraco ou padrão detectado em produção. Altere a variável no arquivo .env");
  }

  return new TextEncoder().encode(value ?? "dev-secret-change-me");
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function setAuthCookie(token: string) {
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(cookieName);
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
});

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) throw new Response(messages.auth.unauthenticated, { status: 401 });
  if (roles?.length && !roles.includes(session.role)) {
    throw new Response(messages.auth.forbidden, { status: 403 });
  }
  return session;
}

export async function getFreshSessionUser(): Promise<(SessionUser & { isActive: boolean; avatarUrl: string | null; department: string | null }) | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    await initializeDatabase();
    const userRepository = getRepository(User);
    const user = await userRepository.findOne({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        department: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      avatarUrl: user.avatarUrl || null,
      department: user.department || null,
      isActive: user.isActive,
    };
  } catch (error) {
    console.error("Falha ao validar sessão do usuário:", error);
    return null;
  }
}

const refreshCookieName = "ti_chamados_refresh";

export async function createRefreshToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function setRefreshCookie(token: string) {
  const store = await cookies();
  store.set(refreshCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearRefreshCookie() {
  const store = await cookies();
  store.delete(refreshCookieName);
  store.delete(cookieName);
}

export async function getRefreshSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(refreshCookieName)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

