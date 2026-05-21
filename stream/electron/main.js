/**
 * Streamline Electron Main Process
 * Wraps the web app with desktop features: adblocker, window management
 */

import { app, BrowserWindow, session, ipcMain, Menu } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import isDev from "electron-is-dev";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ad/tracker blocklist
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
  "*://yt3.ggpht.com/ytc/*",
  "*://gstatic.com/*",
  "*://cdn.adx1.com/*",
  "*://intelligenceadx.com/*",
  "*://adsco.re/*",
  "*://mc.yandex.com/*",
  "*://mc.yandex.ru/*",
  "*://bvtpk.com/*",
  "*://my.rtmark.net/*",
  "*://b7510.com/*",
  "*://static.cloudflareinsights.com/*",
  "*://adeptspiritual.com/*",
];

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: true,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  const startUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupAdblocker(sess) {
  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  sess.setUserAgent(UA);

  // Block ad/tracker requests
  sess.webRequest.onBeforeRequest({ urls: BLOCKED_HOSTS }, (_, callback) =>
    callback({ cancel: true }),
  );

  // Remove X-Frame-Options and CSP headers to allow embedded players
  sess.webRequest.onHeadersReceived(({ responseHeaders }, callback) => {
    const headers = { ...responseHeaders };
    for (const key of Object.keys(headers)) {
      const lower = key.toLowerCase();
      if (lower === "x-frame-options" || lower === "content-security-policy") {
        delete headers[key];
      }
    }
    callback({ responseHeaders: headers });
  });
}

app.on("ready", () => {
  setupAdblocker(session.defaultSession);
  createWindow();
  createMenu();
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

// Minimal menu
function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => {
            if (mainWindow) mainWindow.reload();
          },
        },
        {
          label: "Dev Tools",
          accelerator: "CmdOrCtrl+Shift+I",
          click: () => {
            if (mainWindow) mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers
ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
