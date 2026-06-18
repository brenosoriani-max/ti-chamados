import { config } from "./config/index.js";
import { createSocket } from "./socket/client.js";
import { getOrCreateToken } from "./utils/token-store.js";
import { heartbeat, registerTerminal } from "./services/terminal-service.js";

async function main() {
  const token = await getOrCreateToken();

  try {
    await registerTerminal(token);
    console.log("Terminal registrado.");
  } catch (error) {
    console.error(error.message);
  }

  const socket = createSocket(token);

  const beat = async () => {
    try {
      await heartbeat(token);
      if (socket.connected) socket.emit("terminal:heartbeat", { token });
    } catch (error) {
      console.error(error.message);
    }
  };

  await beat();
  setInterval(beat, config.heartbeatMs);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
