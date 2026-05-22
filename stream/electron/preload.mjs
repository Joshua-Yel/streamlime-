import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("streamDesktop", {
  getBlockStats: () => ipcRenderer.invoke("adblock:get-stats"),
  resetBlockStats: () => ipcRenderer.invoke("adblock:reset-stats"),
  getSessionPartition: (kind) =>
    ipcRenderer.invoke("adblock:get-session-partition", kind),
  openPlayerPopout: (url, title) =>
    ipcRenderer.invoke("player:open-popout", { url, title }),
  closePlayerPopout: () => ipcRenderer.invoke("player:close-popout"),
  isPlayerPopoutOpen: () => ipcRenderer.invoke("player:is-popout-open"),
  onBlockStats: (handler) => {
    const listener = (_, stats) => handler(stats);
    ipcRenderer.on("adblock:stats", listener);
    return () => ipcRenderer.removeListener("adblock:stats", listener);
  },
  onMediaRequest: (handler) => {
    const listener = (_, payload) => handler(payload);
    ipcRenderer.on("adblock:media-request", listener);
    return () => ipcRenderer.removeListener("adblock:media-request", listener);
  },
  onPlayerPopoutOpened: (handler) => {
    const listener = () => handler();
    ipcRenderer.on("player-popout:opened", listener);
    return () => ipcRenderer.removeListener("player-popout:opened", listener);
  },
  onPlayerPopoutClosed: (handler) => {
    const listener = () => handler();
    ipcRenderer.on("player-popout:closed", listener);
    return () => ipcRenderer.removeListener("player-popout:closed", listener);
  },
});
