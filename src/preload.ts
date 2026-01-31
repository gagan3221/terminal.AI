import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("platform", {
  name: process.platform,
  version: process.version,
});

contextBridge.exposeInMainWorld("terminal", {
  onData: (callback: (data: string) => void) => {
    ipcRenderer.on("terminal-data", (_event, data) => callback(data));
  },
  sendInput: (data: string) => {
    ipcRenderer.send("terminal-input", data);
  },
  resize: (cols: number, rows: number) => {
    ipcRenderer.send("terminal-resize", { cols, rows });
  },
  ready: () => {
    ipcRenderer.send("terminal-ready");
  },
});
