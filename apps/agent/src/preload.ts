import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("tiAgent", {
  getDesktopSources: () => ipcRenderer.invoke("desktop:getSources"),
});
