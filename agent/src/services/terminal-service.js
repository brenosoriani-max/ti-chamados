import os from "node:os";
import { config } from "../config/index.js";

function localIp() {
  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces ?? []) {
      if (item.family === "IPv4" && !item.internal) return item.address;
    }
  }
  return null;
}

function terminalPayload() {
  return {
    nome: os.hostname(),
    hostname: os.hostname(),
    identificador: `${os.hostname()}-${os.arch()}`,
    sistemaOperacional: `${os.type()} ${os.release()}`,
    ip: localIp(),
    versaoAgente: config.versaoAgente,
  };
}

export async function registerTerminal(token) {
  const response = await fetch(`${config.apiUrl}/api/agent/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...terminalPayload(), token }),
  });

  if (!response.ok) throw new Error(`Falha no registro: ${response.status}`);
  return response.json();
}

export async function heartbeat(token) {
  const response = await fetch(`${config.apiUrl}/api/agent/heartbeat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(terminalPayload()),
  });

  if (!response.ok) throw new Error(`Falha no heartbeat: ${response.status}`);
  return response.json();
}
