import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "node:path";
import { registerProjectHandlers } from './project-io';
import { registerImageHandlers } from './iiif-fetch';
import { registerDocxExportHandler } from './docx-export';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1600,
    height: 900,
    icon: join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}


function registerSystemHandlers(): void {
  const ALLOWED_PROTOCOLS = ["https:", "http:"];

  ipcMain.handle("shell:open-external", async (_event, url: string) => {
    try {
      const parsed = new URL(url);
      if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        await shell.openExternal(url);
      }
    } catch {
      // Invalid URL — ignore
    }
  });

  // Phase 8 will integrate electron-conf for persistence
  ipcMain.handle("settings:get-language", async () => "pt-BR");
  ipcMain.handle("settings:set-language", async (_event, lang: string) => lang);
  ipcMain.handle("settings:get-theme", async () => "light");
  ipcMain.handle("settings:set-theme", async (_event, _theme: string) => true);
}

app.whenReady().then(() => {
  registerProjectHandlers();
  registerDocxExportHandler();
  registerImageHandlers();
  registerSystemHandlers();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
