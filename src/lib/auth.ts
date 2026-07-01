import { cookies } from "next/headers";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { getDataSource } from "@/lib/db";
import { User } from "@/entities/User";
import { Role } from "@/types";

const cookieName = "ti_chamados_token";

function secret() {
  const value = process.env.JWT_SECRET ?? "dev-secret-change-me";
  return new TextEncoder().encode(value);
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
  if (!session) throw new Response("Nao autenticado", { status: 401 });
  if (roles?.length && !roles.includes(session.role)) {
    throw new Response("Sem permissao", { status: 403 });
  }
  return session;
}

export async function getFreshSessionUser() {
  const session = await getSession();
  if (!session) return null;

  const ds = await getDataSource();
  const repo = ds.getRepository(User);
  return repo.findOne({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      department: true,
    },
  });
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

