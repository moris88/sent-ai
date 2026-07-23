import fs from 'node:fs/promises';
import path from 'node:path';
import { app, BrowserWindow, ipcMain } from 'electron';


const isDev = process.env.VITE_ENV === "development";
console.log(
  `>>> Electron is running in ${isDev ? "development" : "production"} mode.`,
  process.env.VITE_ENV,
);
let mainWindow: BrowserWindow | null = null;

// Funzione helper per recuperare il percorso del file JSON
function getFilePath(key: string): string {
  const userDataPath = app.getPath('userData'); // Es: ~/.config/sentai/ su Linux
  return path.join(userDataPath, `${key}.json`);
}

function registerIpcHandlers() {
  // Salvataggio dati su file .json
  ipcMain.handle('save-data', async (_, { key, data }: { key: string; data: unknown }) => {
    try {
      const filePath = getFilePath(key);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error(`Errore durante il salvataggio di ${key}:`, error);
      return { success: false, error };
    }
  });

  // Lettura dati da file .json
  ipcMain.handle('load-data', async (_, key: string) => {
    try {
      const filePath = getFilePath(key);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch {
      // Se il file non esiste ancora, restituisce null (come fa localStorage)
      return null;
    }
  });
}

app.disableHardwareAcceleration();

function createWindow() {
  console.log('>>> Creazione della finestra Electron in corso...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Se siamo in dev (isPackaged === false), carica localhost
  if (!app.isPackaged) {
    const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
    console.log('>>> Caricamento Dev URL:', devUrl);

    mainWindow.loadURL(devUrl);
    if (isDev) mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app
  .whenReady()
  .then(() => {
    console.log('>>> Electron app è pronta.');
    registerIpcHandlers();
    createWindow();
  })
  .catch((err) => {
    console.error('>>> Errore durante app.whenReady:', err);
  });

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
