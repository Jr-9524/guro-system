// // electron/main.js
// const { app, BrowserWindow } = require("electron");
// const path = require("path");
// const { initDatabase, getDatabase } = require("./database.cjs");
// const { setupIPCHandlers } = require("./ipc-handlers.cjs");

// let mainWindow;

// async function createWindow() {
//   const iconPath =
//     process.env.NODE_ENV === "development"
//      ? path.join(__dirname, "../public/guro_logo.ico")
//       : path.join(__dirname, "../dist/guro_logo.ico");

//   mainWindow = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     minWidth: 1024,
//     minHeight: 768,
//     show: false,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.cjs"),
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//     title: "GURO - IEP Manager",
//     icon: iconPath,
//   });

//   if (process.env.NODE_ENV === "development") {
//     mainWindow.loadURL("http://localhost:5173");
//     mainWindow.webContents.openDevTools();
//   } else {
//     mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
//   }
// }

// app.whenReady().then(async () => {
//   // Initialize database
//   await initDatabase();

//   // Setup IPC handlers
//   setupIPCHandlers();

//   // Create window
//   await createWindow();
// });

// app.on("window-all-closed", () => {
//   const db = getDatabase();
//   if (db) db.close();
//   if (process.platform !== "darwin") app.quit();
// });

// app.on("activate", () => {
//   if (BrowserWindow.getAllWindows().length === 0) createWindow();
// });

const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const { initDatabase, getDatabase } = require("./database.cjs");
const { setupIPCHandlers } = require("./ipc-handlers.cjs");

let mainWindow;

async function createWindow() {
  const iconPath =
    process.env.NODE_ENV === "development"
      ? path.join(__dirname, "../public/guro_logo.ico")
      : path.join(__dirname, "../public/guro_logo.ico");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    title: "GURO - IEP Manager",
    icon: iconPath,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: process.env.NODE_ENV === "development",
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  if (process.env.NODE_ENV === "development") {
    await mainWindow.loadURL("http://localhost:5173");

    // Comment this out if you do not want DevTools to open automatically.
    // mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const viewOnlyMenu = [
  {
    label: "View",
    submenu: [
      {
        label: "Reload",
        accelerator: "CmdOrCtrl+R",
        click: () => mainWindow?.reload(),
      },
      {
        label: "Force Reload",
        accelerator: "CmdOrCtrl+Shift+R",
        click: () => mainWindow?.webContents.reloadIgnoringCache(),
      },
      { type: "separator" },
      {
        label: "Toggle Full Screen",
        accelerator: "F11",
        click: () => {
          if (!mainWindow) return;
          mainWindow.setFullScreen(!mainWindow.isFullScreen());
        },
      },
    ],
  },
];

app.whenReady().then(async () => {
  await initDatabase();
  setupIPCHandlers();

  Menu.setApplicationMenu(Menu.buildFromTemplate(viewOnlyMenu));

  await createWindow();
});

app.on("window-all-closed", () => {
  const db = getDatabase();
  if (db) db.close();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});
