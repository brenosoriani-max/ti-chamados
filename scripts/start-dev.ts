import net from "net";
import { spawn } from "child_process";

const startPort = Number(process.env.PORT || 3000);
const maxPort = startPort + 10;

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

(async () => {
  let freePort: number | null = null;
  for (let p = startPort; p <= maxPort; p++) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkPort(p);
    if (ok) {
      freePort = p;
      break;
    }
  }

  if (!freePort) {
    console.error(`No free port found in range ${startPort}-${maxPort}`);
    process.exit(1);
  }

  console.log(`Starting dev server on port ${freePort}`);

  const child = spawn("npx", ["tsx", "server.ts"], {
    env: { ...process.env, PORT: String(freePort) },
    stdio: "inherit",
  });

  child.on("exit", (code) => process.exit(code ?? 0));
})();
