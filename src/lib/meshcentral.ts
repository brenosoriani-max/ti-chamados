import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { initializeDatabase, getRepository } from "@/lib/database";
import { Terminal } from "@/entities/Terminal";

const execFileAsync = promisify(execFile);

export type RemoteSessionTarget = {
  provider: "meshcentral";
  sessionUrl: string;
  deviceId?: string;
  device?: Record<string, unknown> | null;
};

export type MeshCentralDevice = {
  _id?: string;
  id?: string;
  name?: string;
  hostname?: string;
  computername?: string;
  osdesc?: string;
  conn?: boolean | number | string;
  user?: string;
  username?: string;
  users?: string[];
  [key: string]: unknown;
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

function normalizeMeshCentralWsUrl(value: string) {
  const raw = value.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const wsProtocol = url.protocol === "https:" ? "wss:" : url.protocol === "http:" ? "ws:" : url.protocol;
    return `${wsProtocol}//${url.host}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getMeshCentralControlUrls(value: string) {
  const normalized = normalizeMeshCentralWsUrl(value);
  const candidates = new Set<string>();

  if (normalized) candidates.add(normalized);

  try {
    const url = new URL(value.trim());
    if (url.protocol === "http:") {
      candidates.add(`wss://${url.host}`);
      candidates.add(`ws://${url.host}`);
    }
    if (url.protocol === "https:") {
      candidates.add(`wss://${url.host}`);
      candidates.add(`ws://${url.host}`);
    }
    if (url.protocol === "ws:") candidates.add(`ws://${url.host}`);
    if (url.protocol === "wss:") candidates.add(`wss://${url.host}`);
  } catch {
    // noop
  }

  return [...candidates];
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

function normalizeMeshValue(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeMeshCentralNodeId(rawValue: string) {
  const value = String(rawValue ?? "").trim();
  if (!value) return "";

  const normalizedValue = value.replace(/^node\/\/?/i, "");

  if (/^[0-9a-fA-F]{96}$/.test(normalizedValue)) {
    const hexBuffer = Buffer.from(normalizedValue, "hex");
    const base64 = hexBuffer.toString("base64");
    return base64.replace(/\+/g, "@").replace(/\//g, "$");
  }

  return normalizedValue.replace(/\+/g, "@").replace(/\//g, "$");
}

function buildMeshCentralDeviceLink(baseUrl: string, deviceId: string) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const nodeId = normalizeMeshCentralNodeId(deviceId);

  if (!nodeId) {
    return `${normalizedBaseUrl}/`;
  }

  return `${normalizedBaseUrl}/?viewmode=11&gotonode=${encodeURIComponent(nodeId)}`;
}

export function getMeshCentralConfig() {
  const baseUrl = normalizeMeshCentralBaseUrl(process.env.MESHCENTRAL_URL ?? "");
  const username = (process.env.MESHCENTRAL_USERNAME ?? process.env.MESHCENTRAL_USER ?? "").trim();
  const password = (process.env.MESHCENTRAL_PASSWORD ?? process.env.MESHCENTRAL_PASS ?? "").trim();
  const loginTokenKey = (process.env.MESHCENTRAL_LOGIN_TOKEN_KEY ?? process.env.MESHCENTRAL_LOGIN_KEY ?? "").trim();

  return {
    baseUrl,
    username,
    password,
    loginTokenKey,
    enabled: Boolean(baseUrl),
  };
}

export function getMeshCentralMeshCtrlPath() {
  const configured = (process.env.MESHCENTRAL_MESHCTRL_PATH ?? "").trim();
  const candidates = [
    configured,
    path.resolve(process.cwd(), "node_modules", "meshcentral", "meshctrl.js"),
    path.resolve(process.cwd(), "node_modules", "meshcentral", "meshctl.js"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (fs.existsSync(candidate)) return candidate;
  }

  if (configured) return configured;

  return path.resolve(process.cwd(), "node_modules", "meshcentral", "meshctrl.js");
}

async function runMeshCentralCommand(args: string[]) {
  const { baseUrl, username, password, loginTokenKey } = getMeshCentralConfig();
  const meshCtrlPath = getMeshCentralMeshCtrlPath();

  if (!baseUrl) {
    throw new Error("MESHCENTRAL_URL não configurada ou inválida.");
  }

  const candidateUrls = getMeshCentralControlUrls(baseUrl);
  const lastError: Error[] = [];

  for (const meshCtrlUrl of candidateUrls) {
    const commandArgs = [meshCtrlPath, ...args];

    commandArgs.push("--url", meshCtrlUrl);

    if (username && password) {
      commandArgs.push("--loginuser", username, "--loginpass", password);
    } else if (loginTokenKey) {
      commandArgs.push("--loginkey", loginTokenKey);
    }

    commandArgs.push("--json");

    try {
      const { stdout } = await execFileAsync("node", commandArgs, { cwd: process.cwd() });
      return stdout.trim();
    } catch (error) {
      lastError.push(error instanceof Error ? error : new Error(String(error)));
    }
  }

  if (lastError.length > 0) {
    throw new Error(lastError[lastError.length - 1].message);
  }

  throw new Error("Falha ao consultar MeshCentral.");
}

function parseMeshCentralOutput(stdout: string) {
  const trimmed = stdout.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

export async function resolveMeshCentralDeviceForTerminal(terminalId: string) {
  await initializeDatabase();
  const terminal = await getRepository(Terminal).findOne({ where: { id: terminalId } });

  if (!terminal) {
    throw new Error("Terminal não encontrado para abrir sessão remota.");
  }

  const devices = await listMeshCentralDevices();
  const matchingDevice = findMeshCentralDeviceCandidate(terminal, devices);
  const resolvedDeviceId = String(
    matchingDevice?._id ?? matchingDevice?.id ?? terminal.equipmentUuid ?? terminal.identificador ?? terminal.hostname ?? terminal.id ?? ""
  ).trim();

  return {
    terminal,
    device: matchingDevice ?? null,
    deviceId: resolvedDeviceId,
  };
}

export async function executeMeshCentralDeviceAction({
  terminalId,
  action,
  deviceId,
  options,
}: {
  terminalId: string;
  action: "message" | "openUrl" | "power" | "runCommand";
  deviceId?: string;
  options?: Record<string, string | number | boolean | undefined | null>;
}) {
  const { baseUrl } = getMeshCentralConfig();
  if (!baseUrl) {
    throw new Error("MESHCENTRAL_URL não configurada ou inválida.");
  }

  const targetDeviceId = String(deviceId ?? (await resolveMeshCentralDeviceForTerminal(terminalId)).deviceId ?? "").trim();
  if (!targetDeviceId) {
    throw new Error("Nenhum dispositivo MeshCentral correspondente ao terminal foi encontrado.");
  }

  const normalizedAction = action;
  const commandArgs: string[] = [];

  switch (normalizedAction) {
    case "message": {
      commandArgs.push("DeviceMessage", "--id", targetDeviceId, "--msg", String(options?.msg ?? options?.message ?? ""));
      if (options?.title) commandArgs.push("--title", String(options.title));
      if (options?.timeout) commandArgs.push("--timeout", String(options.timeout));
      break;
    }
    case "openUrl": {
      commandArgs.push("DeviceOpenUrl", "--id", targetDeviceId, "--openurl", String(options?.url ?? options?.openUrl ?? ""));
      break;
    }
    case "power": {
      const powerMode = String(options?.mode ?? options?.operation ?? "").toLowerCase();
      const validModes = ["wake", "sleep", "reset", "off"] as const;
      if (!validModes.includes(powerMode as (typeof validModes)[number])) {
        throw new Error("Operação de energia inválida. Use wake, sleep, reset ou off.");
      }
      commandArgs.push("DevicePower", "--id", targetDeviceId, `--${powerMode}`);
      break;
    }
    case "runCommand": {
      const command = String(options?.command ?? options?.run ?? "").trim();
      if (!command) {
        throw new Error("Comando obrigatório para RunCommand.");
      }

      commandArgs.push("RunCommand", "--id", targetDeviceId, "--run", command);
      if (options?.powershell) commandArgs.push("--powershell");
      if (options?.reply) commandArgs.push("--reply");
      if (options?.runAsUser) commandArgs.push("--runasuser");
      if (options?.runAsUserOnly) commandArgs.push("--runasuseronly");
      break;
    }
    default:
      throw new Error(`Ação remota inválida: ${String(action)}`);
  }

  const stdout = await runMeshCentralCommand(commandArgs);
  return {
    ok: true,
    action: normalizedAction,
    deviceId: targetDeviceId,
    result: parseMeshCentralOutput(stdout),
  };
}

export async function listMeshCentralDevices(): Promise<MeshCentralDevice[]> {
  const { baseUrl, username, password, loginTokenKey } = getMeshCentralConfig();
  if (!baseUrl || (!username && !password && !loginTokenKey)) {
    return [];
  }

  try {
    const stdout = await runMeshCentralCommand(["ListDevices"]);
    if (!stdout) return [];

    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed)) return parsed as MeshCentralDevice[];

    const candidates = [
      parsed?.devices,
      parsed?.result,
      parsed?.data,
      parsed?.nodes,
      parsed?.items,
      parsed?.devicesList,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate as MeshCentralDevice[];
    }

    return [];
  } catch (error) {
    console.warn("MeshCentral ListDevices indisponível:", error instanceof Error ? error.message : error);
    return [];
  }
}

export function findMeshCentralDeviceCandidate(terminal: Terminal, devices: MeshCentralDevice[]) {
  const searchValues = [
    terminal.hostname,
    terminal.identificador,
    terminal.equipmentUuid,
    terminal.nome,
    terminal.usuarioLogado,
    terminal.ip,
    terminal.id,
  ]
    .filter(Boolean)
    .map((value) => normalizeMeshValue(value));

  if (!searchValues.length) return null;

  for (const device of devices) {
    const candidates = [
      device.name,
      device.hostname,
      device.computername,
      device._id,
      device.id,
      device.user,
      device.username,
      ...(Array.isArray(device.users) ? device.users : []),
      device.osdesc,
    ]
      .filter(Boolean)
      .map((value) => normalizeMeshValue(value));

    const matches = candidates.some((candidate) => searchValues.some((value) => value && candidate.includes(value)));
    if (matches) return device;

    const sameName = searchValues.some((value) => candidates.includes(value));
    if (sameName) return device;
  }

  return null;
}

function isMeshDeviceOnline(device: MeshCentralDevice | null | undefined) {
  if (!device) return false;
  return [true, 1, "1", "true"].includes(device.conn as never);
}

export function deduplicateMeshCentralDevices(devices: MeshCentralDevice[]) {
  const byKey = new Map<string, MeshCentralDevice>();

  for (const device of devices) {
    const label = String(
      device.name ?? device.hostname ?? device.computername ?? device.id ?? device._id ?? ""
    )
      .trim()
      .toLowerCase();

    if (!label) {
      byKey.set(`fallback-${byKey.size}-${Math.random()}`, device);
      continue;
    }

    const existing = byKey.get(label);
    if (!existing) {
      byKey.set(label, device);
      continue;
    }

    const currentOnline = isMeshDeviceOnline(device);
    const existingOnline = isMeshDeviceOnline(existing);

    if (currentOnline && !existingOnline) {
      byKey.set(label, device);
      continue;
    }

    if (currentOnline === existingOnline) {
      const existingUser = String(existing.user ?? existing.username ?? "");
      const currentUser = String(device.user ?? device.username ?? "");
      if (currentUser.length > existingUser.length) {
        byKey.set(label, device);
      }
    }
  }

  return Array.from(byKey.values());
}

export async function resolveRemoteSessionTarget(terminalId?: string, deviceIdOverride?: string): Promise<RemoteSessionTarget> {
  const { baseUrl } = getMeshCentralConfig();
  if (!baseUrl) {
    throw new Error("MESHCENTRAL_URL não configurada ou inválida. Use algo como http://localhost:8000 ou https://meshcentral.seudominio.com.");
  }

  let terminal: Terminal | null = null;
  let device: MeshCentralDevice | null = null;
  let resolvedDeviceId = String(deviceIdOverride ?? "").trim();

  if (terminalId) {
    await initializeDatabase();
    terminal = await getRepository(Terminal).findOne({ where: { id: terminalId } });
    if (!terminal) {
      throw new Error("Terminal não encontrado para abrir sessão remota.");
    }

    const devices = await listMeshCentralDevices();
    const matchingDevice = findMeshCentralDeviceCandidate(terminal, devices);
    device = matchingDevice ?? null;
    resolvedDeviceId = String(matchingDevice?._id ?? matchingDevice?.id ?? terminal.equipmentUuid ?? terminal.identificador ?? terminal.hostname ?? terminal.id ?? "").trim();
  } else if (!resolvedDeviceId) {
    throw new Error("deviceId obrigatório para abrir a sessão remota.");
  }

  const sessionUrl = buildMeshCentralDeviceLink(baseUrl, resolvedDeviceId);
  const lookup = terminal?.identificador || terminal?.hostname || terminal?.nome || terminal?.id || resolvedDeviceId;
  const terminalName = terminal?.nome ?? terminal?.hostname ?? terminal?.identificador ?? "Terminal";

  return {
    provider: "meshcentral",
    deviceId: resolvedDeviceId,
    device: device ?? null,
    sessionUrl,
  };
}

export async function createMeshCentralLoginLink({ deviceId, terminalName }: { deviceId?: string; terminalName?: string }) {
  const { baseUrl } = getMeshCentralConfig();
  if (!baseUrl) {
    throw new Error("MESHCENTRAL_URL não configurada ou inválida.");
  }

  if (!deviceId) {
    return `${baseUrl.replace(/\/$/, "")}/`;
  }

  return buildMeshCentralDeviceLink(baseUrl, deviceId);
}
