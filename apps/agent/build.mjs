import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: [path.join(__dirname, "src/main.ts"), path.join(__dirname, "src/preload.ts")],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outdir: path.join(__dirname, "dist"),

  // Electron built-ins that must NOT be bundled
  external: [
    "electron",
    // Native node modules
    "@nut-tree-fork/nut-js",
    "electron-store",
    // Node built-ins (esbuild handles these automatically with platform:node)
  ],

  // Source maps for debugging
  sourcemap: true,

  // Preserve file names for easier debugging
  outbase: path.join(__dirname, "src"),

  logLevel: "info",
};

if (isWatch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log("[esbuild] Watching for changes...");
} else {
  await esbuild.build(options);
  console.log("[esbuild] Build complete.");
}
