import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { requireSession } from "@/lib/auth";
import { executeMeshCentralDeviceAction } from "@/lib/meshcentral";

export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const body = await request.json().catch(() => ({}));
  const action = String(body?.action ?? "").trim();
  const terminalId = String(body?.terminalId ?? "").trim();
  const deviceId = String(body?.deviceId ?? "").trim();
  const options = body?.options ?? body ?? {};

  if (!action) {
    return NextResponse.json({ error: "action obrigatório" }, { status: 400 });
  }

  if (!terminalId && !deviceId) {
    return NextResponse.json({ error: "terminalId ou deviceId obrigatório" }, { status: 400 });
  }

  try {
    const result = await executeMeshCentralDeviceAction({
      terminalId: terminalId || deviceId,
      deviceId: deviceId || undefined,
      action: action as "message" | "openUrl" | "power" | "runCommand",
      options,
    });

    return NextResponse.json({
      ok: true,
      provider: "meshcentral",
      action,
      deviceId: result.deviceId,
      result: result.result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível executar a ação remota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
