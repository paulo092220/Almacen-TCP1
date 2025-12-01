
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple migration. In production, use preload scripts.
    },
    title: "The Brothers",
    icon: path.join(__dirname, 'icon.png') // Ensure you have an icon if you build
  });

  // Remove menu bar for a cleaner app look (optional)
  mainWindow.setMenuBarVisibility(false);

  // In development, load from Vite server
  // In production, load from file
  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
  
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers
ipcMain.handle('quit-app', () => {
  app.quit();
});