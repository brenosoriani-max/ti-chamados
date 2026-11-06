import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { Role } from "@/types";
import { requireSession } from "@/lib/auth";
import { listMeshCentralDevices, resolveRemoteSessionTarget, deduplicateMeshCentralDevices } from "@/lib/meshcentral";

export async function GET(_request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const devices = deduplicateMeshCentralDevices(await listMeshCentralDevices());

  return NextResponse.json({
    provider: "meshcentral",
    total: devices.length,
    devices: devices.map((device) => {
      const deviceId = String(device._id ?? device.id ?? "");
      const name = device.name ?? device.hostname ?? device.computername ?? "Dispositivo";
      const statusValue = device.conn;
      const online = [true, 1, "1", "true"].includes(statusValue as never);

      return {
        id: deviceId,
        name,
        hostname: device.hostname ?? device.computername ?? null,
        user: device.user ?? device.username ?? device.users?.[0] ?? null,
        os: device.osdesc ?? null,
        online,
        status: online ? "online" : "offline",
        raw: device,
      };
    }),
  });
}

export async function POST(request: NextRequest) {
  await requireSession([Role.TECNICO, Role.ADMIN]);

  const body = await request.json().catch(() => ({}));
  const terminalId = String(body?.terminalId ?? "").trim();
  const deviceId = String(body?.deviceId ?? "").trim();

  if (!terminalId && !deviceId) {
    return NextResponse.json({ error: "terminalId ou deviceId obrigatório" }, { status: 400 });
  }

  try {
    const target = await resolveRemoteSessionTarget(terminalId || undefined, deviceId || undefined);
    return NextResponse.json({
      provider: target.provider,
      deviceId: target.deviceId,
      sessionUrl: target.sessionUrl,
      device: target.device,
      route: terminalId ? `/terminais/${terminalId}/remoto` : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível abrir a sessão remota.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
