import os from "node:os";
import path from "node:path";

export const config = {
  apiUrl: process.env.AGENT_API_URL ?? "http://localhost:3000",
  socketUrl: process.env.AGENT_SOCKET_URL ?? process.env.AGENT_API_URL ?? "http://localhost:3000",
  tokenPath: process.env.AGENT_TOKEN_PATH ?? path.join(os.homedir(), ".ti-chamados-agent-token"),
  heartbeatMs: Number(process.env.AGENT_HEARTBEAT_MS ?? 15000),
  versaoAgente: "1.0.0",
};
