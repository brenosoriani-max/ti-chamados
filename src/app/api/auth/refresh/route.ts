import { NextRequest, NextResponse } from "next/server";
import { getRefreshSession, createSessionToken, setAuthCookie, getFreshSessionUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const refreshUser = await getRefreshSession();

  if (!refreshUser) {
    return NextResponse.json(
      { error: "Refresh token inválido ou expirado" },
      { status: 401 }
    );
  }

  // Fetch fresh user data from DB
  const user = await getFreshSessionUser();
  if (!user || !user.isActive) {
    return NextResponse.json(
      { error: "Usuário inativo ou não encontrado" },
      { status: 401 }
    );
  }

  // Create new session access token
  const token = await createSessionToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  await setAuthCookie(token);

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
    },
  });
}
