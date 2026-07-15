import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("tiAgent", {
  getDesktopSources: () => ipcRenderer.invoke("desktop:getSources"),
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: any) => ipcRenderer.invoke("settings:save", settings),
  hideWindow: () => ipcRenderer.send("window:hide"),
  onStatusUpdated: (callback: (data: any) => void) => {
    ipcRenderer.on("status-updated", (_, data) => callback(data));
  }
});

