import { NextResponse } from "next/server";
import { Role } from "@/types";
import { createSessionToken, getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
  }
  if (session.role !== Role.ADMIN && session.role !== Role.TECNICO) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
  }

  const token = await createSessionToken(session);
  return NextResponse.json({ token });
}
