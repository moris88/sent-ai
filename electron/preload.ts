import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  saveData: (key, data) => ipcRenderer.invoke('save-data', { key, data }),
  loadData: (key) => ipcRenderer.invoke('load-data', key),
});
