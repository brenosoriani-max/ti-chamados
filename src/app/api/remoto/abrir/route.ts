import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { resolveRemoteSessionTarget } from "@/lib/meshcentral";

export async function POST(request: NextRequest) {
  await requireSession();

  const body = await request.json().catch(() => ({}));
  const terminalId = String(body?.terminalId ?? "").trim();

  if (!terminalId) {
    return NextResponse.json({ error: "terminalId obrigatório" }, { status: 400 });
  }

  try {
    const target = await resolveRemoteSessionTarget(terminalId);
    return NextResponse.json({
      provider: target.provider,
      sessionUrl: target.sessionUrl,
      route: `/terminais/${terminalId}/remoto`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir a sessão remota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
