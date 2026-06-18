import fs from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { config } from "../config/index.js";

export async function getOrCreateToken() {
  if (process.env.AGENT_TOKEN) return process.env.AGENT_TOKEN;

  try {
    return (await fs.readFile(config.tokenPath, "utf8")).trim();
  } catch {
    const token = randomBytes(32).toString("hex");
    await fs.writeFile(config.tokenPath, token, "utf8");
    return token;
  }
}
