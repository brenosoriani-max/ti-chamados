import os from "os";
import { screen } from "electron";

const AGENT_VERSION = "1.0.5";

export function collectSystemInfo() {
  const primary = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  return {
    hostname: os.hostname(),
    machineName: os.hostname(),
    sistemaOperacional: `${os.type()} ${os.release()}`,
    windowsVersion: os.release(),
    arquitetura: os.arch(),
    memoriaRamGb: Math.round(os.totalmem() / 1024 / 1024 / 1024),
    processador: os.cpus()[0]?.model ?? "Unknown",
    usuarioLogado: os.userInfo().username,
    ip: getLocalIp(),
    versaoAgente: AGENT_VERSION,
    resolucaoTela: `${primary.size.width}x${primary.size.height}`,
    quantidadeMonitores: displays.length,
  };
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "127.0.0.1";
}
