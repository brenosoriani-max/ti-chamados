import { app, BrowserWindow, desktopCapturer, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import { startAgent, stopAgent, getAgentStatus, setStatusChangeListener } from "./agent/bootstrap";
import { getServerUrl, setServerUrl, getTerminalName, setTerminalName, getToken, setToken } from "./storage/store";
import { SETUP_HTML } from "./agent/setupHtml";

// Must be called before app is ready — prevents GPU conflicts in headless capture windows
app.disableHardwareAcceleration();

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 420,
      height: 600,
      show: false,
      autoHideMenuBar: true,
      resizable: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.on("close", (e) => {
      if (!isQuitting && getServerUrl()) {
        e.preventDefault();
        mainWindow?.hide();
      }
    });
  }

  app.whenReady().then(async () => {
    createWindow();

    ipcMain.handle("settings:get", () => {
      const activeStatus = getAgentStatus();
      return {
        serverUrl: getServerUrl() || "",
        terminalName: getTerminalName() || "",
        token: getToken() || "",
        status: activeStatus.status,
        error: activeStatus.error,
      };
    });

    ipcMain.handle("settings:save", async (_, data: { serverUrl: string; terminalName?: string; token?: string }) => {
      setServerUrl(data.serverUrl);
      setTerminalName(data.terminalName || "");
      setToken(data.token || "");
      await startAgent();
    });

    
    ipcMain.handle("agent:stop", async () => {
    await stopAgent();
    });

    ipcMain.handle("agent:restart", async () => {
    await startAgent();
    });

    ipcMain.on("window:hide", () => {
      if (mainWindow) {
        mainWindow.hide();
      }
    });



    ipcMain.handle("desktop:getSources", async () => {
      const sources = await desktopCapturer.getSources({ types: ["screen"], thumbnailSize: { width: 0, height: 0 } });
      return sources.map((s) => ({ id: s.id, name: s.name }));
    });

    setStatusChangeListener((statusData) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("status-updated", statusData);
      }
    });

    const setupHtmlPath = path.join(app.getPath("userData"), "agent-setup.html");
    fs.writeFileSync(setupHtmlPath, SETUP_HTML, "utf-8");
    if (mainWindow) {
      await mainWindow.loadFile(setupHtmlPath);
    }

    const serverUrl = getServerUrl();
    if (!serverUrl) {
      if (mainWindow) {
        mainWindow.show();
      }
    } else {
      await startAgent();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

