import { app, BrowserWindow, desktopCapturer, ipcMain } from "electron";
import path from "path";
import { startAgent } from "./agent/bootstrap";

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
}

app.whenReady().then(async () => {
  createWindow();
  ipcMain.handle("desktop:getSources", async () => {
    const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
    return sources.map((s) => ({ id: s.id, name: s.name }));
  });
  await startAgent();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
