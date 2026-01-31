import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import * as pty from "node-pty";
import os from "os";

let ptyProcess: any = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true, // Enable DevTools
    },
  });

  win.loadFile("index.html");
  
  // Open DevTools on F12 or Cmd+Option+I (macOS) / Ctrl+Shift+I (Windows/Linux)
  win.webContents.once("did-finish-load", () => {
    // Register global shortcut for F12
    globalShortcut.register("F12", () => {
      if (win.webContents.isDevToolsOpened()) {
        win.webContents.closeDevTools();
      } else {
        win.webContents.openDevTools();
      }
    });
  });

  // Create PTY when renderer signals it's ready
  ipcMain.once("terminal-ready", () => {
    // Create a pseudo-terminal after window is ready
    const shell = os.platform() === "win32" ? "powershell.exe" : process.env.SHELL || "/bin/zsh";
    
    console.log(`Spawning shell: ${shell}`);
    
    // Ensure shell runs interactively
    const env = { ...process.env };
    env.TERM = "xterm-256color";
    env.COLORTERM = "truecolor";
    
    ptyProcess = pty.spawn(shell, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 30,
      cwd: process.env.HOME || process.cwd(),
      env: env as any,
    });
    
    console.log(`PTY spawned with PID: ${ptyProcess.pid}`);

    console.log("PTY process created:", ptyProcess.pid);

    // Send terminal output to renderer
    ptyProcess.onData((data: string) => {
      win.webContents.send("terminal-data", data);
    });
    
    // Force a prompt if shell doesn't send one
    // Some shells need a newline to show prompt
    setTimeout(() => {
      if (ptyProcess && !ptyProcess.killed) {
        // Send a newline to trigger prompt
        ptyProcess.write('\n');
      }
    }, 500);

    // Handle terminal exit
    ptyProcess.onExit(({ exitCode }: { exitCode: number }) => {
      console.log(`Terminal exited with code: ${exitCode}`);
      win.webContents.send("terminal-data", `\r\n[Process exited with code ${exitCode}]\r\n`);
    });
  });

  // Receive input from renderer
  ipcMain.on("terminal-input", (_event, data: string) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    } else {
      console.warn("PTY process not initialized yet, input ignored:", JSON.stringify(data));
    }
  });

  // Handle terminal resize
  ipcMain.on("terminal-resize", (_event, { cols, rows }: { cols: number; rows: number }) => {
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
    }
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
  
  if (ptyProcess) {
    ptyProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
