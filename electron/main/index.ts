import { app, BrowserWindow, shell, ipcMain } from "electron";
import { ChildProcess, exec } from "child_process";
import { release } from "os";
import { join } from "path";
import iconv from "iconv-lite";
import isElevated from "is-elevated";

// Disable GPU Acceleration for Windows 7
if (release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export const ROOT_PATH = {
  // /dist
  dist: join(__dirname, "../.."),
  // /dist or /public
  public: join(__dirname, app.isPackaged ? "../.." : "../../../public"),
};

let win: BrowserWindow | null = null;
let cp: ChildProcess | null = null;
let sudoPassword = "";
// Here, you can also use other preload
const preload = join(__dirname, "../preload/index.js");
const url = process.env.VITE_DEV_SERVER_URL as string;
const indexHtml = join(ROOT_PATH.dist, "index.html");
const textDecoder = (buf: Buffer): string =>
  iconv.decode(buf, process.platform === "win32" ? "gb2312" : "utf8");

const killCp = () => {
  if (cp) {
    if (process.platform === "win32") {
      cp.kill();
    } else {
      exec(`echo '${sudoPassword}' | sudo -S killall edge`);
    }
  }
};

async function createWindow() {
  win = new BrowserWindow({
    title: "ChingC's VPN Connector",
    icon: join(ROOT_PATH.public, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: true
    },
  });

  if (app.isPackaged) {
    win.loadFile(indexHtml);
  } else {
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools({ mode: "detach" });
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.on("before-quit", () => {
  killCp();
});

ipcMain.handle("set-sudo-password", (event: Event, pass: string) => {
  sudoPassword = pass
})

ipcMain.handle("connect-supernode", (event, path: string, args: string[]) => {
  killCp();
  const splitter = process.platform === 'win32' ? '\"' : '\''; 
  const cmd = [path, ...args].map((a) => `${splitter}${a}${splitter}`).join(" ");
  if (process.platform === 'win32') {
    cp = exec(cmd, { encoding: 'buffer' })
  } else {
    cp = exec(`echo '${sudoPassword}' | sudo -S ${cmd}`, { encoding: 'buffer' });
  }

  const onClose = (why: string) => {
    win.webContents.send("log", why);
    win.webContents.send("disconnected");
    cp = null;
  };

  cp.on("spawn", () => {
    win.webContents.send("connected");
  });

  cp.stdout.on("data", (line) => {
    win.webContents.send("log", textDecoder(line));
  });

  cp.stderr.on("data", (line) => {
    win.webContents.send("log", textDecoder(line));
  });

  cp.on("error", (error) => {
    console.log(error);
    onClose("[ERROR] " + error + "\n");
  });

  cp.on("close", () => {
    onClose("edge process is exited\n");
  });
});

ipcMain.handle("disconnect-supernode", (event) => {
  killCp();
});

ipcMain.handle("did-window-loaded", () => {
  isElevated().then((elevated) => {
    if (!elevated && process.platform !== 'win32') {
      win.webContents.send("show-not-elevated");
    }
  });
});

ipcMain.handle("quit-app", () => {
  win.close();
  app.quit();
});
