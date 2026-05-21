// -- Streamline main process entry point
// Responsible for: window creation, session setup, ad-blocking, and app lifecycle.

const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

// -- RAM / performance flags
app.commandLine.appendSwitch(
  "js-flags",
  "--max-old-space-size=256 --expose-gc",
);
app.commandLine.appendSwitch(
  "disable-features",
  "HardwareMediaKeyHandling,MediaSessionService",
);
app.commandLine.appendSwitch("enable-features", "NetworkServiceInProcess2");

// Cap disk cache and limit renderer processes
app.commandLine.appendSwitch("disk-cache-size", String(80 * 1024 * 1024));
app.commandLine.appendSwitch("renderer-process-limit", "3");

const isDev = require("electron-is-dev");
const _t0 = Date.now();
const _bench = (label) =>
  console.log(`[boot] ${label}: +${Date.now() - _t0}ms`);

let mainWindow;

// -- Ad/tracker block list
const BLOCKED_HOSTS = [
  "*://www.google-analytics.com/*",
  "*://analytics.google.com/*",
  "*://googletagmanager.com/*",
  "*://www.googletagmanager.com/*",
  "*://googletagservices.com/*",
  "*://doubleclick.net/*",
  "*://*.doubleclick.net/*",
  "*://adservice.google.com/*",
  "*://pagead2.googlesyndication.com/*",
  "*://stats.g.doubleclick.net/*",
  "*://fonts.googleapis.com/*",
  "*://fonts.gstatic.com/*",
  "*://cdn.adx1.com/*",
  "*://intelligenceadx.com/*",
  "*://adsco.re/*",
  "*://mc.yandex.com/*",
  "*://bvtpk.com/*",
  "*://my.rtmark.net/*",
  "*://b7510.com/*",
  "*://acscdn.com/*",
  "*://s10.histats.com/*",
  "*://weirdopt.com/*",
  "*://static.cloudflareinsights.com/*",
  "*://adeptspiritual.com/*",
  "*://amavhxdlofklxjg.xyz/*",
  "*://usrpubtrk.com/*",
  "*://adexchangeclear.com/*",
];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  _bench("window created");
}

function setupAdblocking() {
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: BLOCKED_HOSTS },
    (details, callback) => {
      callback({ cancel: true });
    },
  );
  _bench("adblock rules registered");
}

app.on("ready", () => {
  setupAdblocking();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app version requests
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
