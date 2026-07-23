import { contextBridge, ipcRenderer } from 'electron';

// Espone API sicure al frontend se necessario
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  saveData: (key: string, data: unknown) => ipcRenderer.invoke('save-data', { key, data }),
  loadData: (key: string) => ipcRenderer.invoke('load-data', key),
});
