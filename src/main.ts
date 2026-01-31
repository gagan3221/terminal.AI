import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import path from "path";
import * as pty from "node-pty";
import os from "os";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let ptyProcess: any = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1600,
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
    
    // Don't force a prompt - let the shell initialize naturally
    // The shell will send its prompt automatically

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

  // Handle chat messages
  ipcMain.handle("chat-message", async (_event, message: string) => {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      throw new Error("Groq API key not found. Please check your .env file.");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant integrated into a terminal application. Provide concise, helpful responses.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Groq API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ""}`
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "No response from AI.";
    } catch (error: any) {
      console.error("Chat error:", error);
      throw new Error(error.message || "Failed to get response from AI.");
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
