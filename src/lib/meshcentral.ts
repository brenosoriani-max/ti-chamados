import { initializeDatabase, getRepository } from "@/lib/database";
import { Terminal } from "@/entities/Terminal";

export type RemoteSessionTarget = {
  provider: "meshcentral";
  sessionUrl: string;
};

export function getRemoteProvider(): "meshcentral" {
  return "meshcentral";
}

function normalizeMeshCentralBaseUrl(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    return url.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getMeshDeviceIdentifier(terminal: Terminal) {
  return (
    terminal.equipmentUuid ||
    terminal.identificador ||
    terminal.hostname ||
    terminal.nome ||
    terminal.id
  );
}

export async function resolveRemoteSessionTarget(terminalId: string): Promise<RemoteSessionTarget> {
  const baseUrl = normalizeMeshCentralBaseUrl(process.env.MESHCENTRAL_URL ?? "");
  if (!baseUrl) {
    throw new Error("MESHCENTRAL_URL não configurada ou inválida. Use algo como http://localhost:8000 ou https://meshcentral.seudominio.com.");
  }

  await initializeDatabase();
  const terminal = await getRepository(Terminal).findOne({ where: { id: terminalId } });
  if (!terminal) {
    throw new Error("Terminal não encontrado para abrir sessão remota.");
  }

  const lookup = terminal.identificador || terminal.hostname || terminal.nome || terminal.id;
  const terminalName = terminal.nome ?? terminal.hostname ?? terminal.identificador ?? "Terminal";
  const meshDeviceId = getMeshDeviceIdentifier(terminal);

  const params = new URLSearchParams({
    source: "ti-chamados",
    terminalId,
    terminalName,
    terminalIdentifier: lookup,
    mode: "remote",
    session: "support",
    deviceId: meshDeviceId,
    device: meshDeviceId,
    id: meshDeviceId,
  });

  return {
    provider: "meshcentral",
    sessionUrl: `${baseUrl}/#/remote?${params.toString()}`,
  };
}
