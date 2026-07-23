import { useEffect, useState } from 'react';

export function useStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  // 1. Caricamento iniziale
  useEffect(() => {
    async function load() {
      try {
        if (window.electronAPI) {
          // Usa il File System nativo
          const fileData = await window.electronAPI.loadData<T>(key);
          if (fileData !== null) setStoredValue(fileData);
        } else {
          // Fallback su localStorage per browser web
          const item = window.localStorage.getItem(key);
          if (item) setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(`Errore caricamento ${key}:`, error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [key]);

  // 2. Funzione per aggiornare e salvare i dati
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (window.electronAPI) {
        // Salva su File System
        await window.electronAPI.saveData(key, valueToStore);
      } else {
        // Salva su localStorage
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Errore salvataggio ${key}:`, error);
    }
  };

  return [storedValue, setValue, loading] as const;
}
