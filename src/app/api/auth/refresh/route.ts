import { NextRequest, NextResponse } from "next/server";
import { getRefreshSession, createSessionToken, setAuthCookie, getFreshSessionUser } from "@/lib/auth";
import { messages } from "@/lib/messages";

export async function POST(_request: NextRequest) {
  const refreshUser = await getRefreshSession();

  if (!refreshUser) {
    return NextResponse.json({ error: messages.auth.refreshInvalid }, { status: 401 });
  }

  const user = await getFreshSessionUser();
  if (!user || !user.isActive) {
    return NextResponse.json({ error: messages.auth.inactiveUser }, { status: 401 });
  }

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
