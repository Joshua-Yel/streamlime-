/**
 * Streamline Electron Preload
 * Minimal secure context bridge for web app
 */

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  isDev: process.env.NODE_ENV === "development",
});
