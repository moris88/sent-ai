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

  // 2. Salvataggio ad ogni modifica, solo dopo il caricamento per non sovrascrivere i dati su disco
  useEffect(() => {
    if (loading) return;
    async function save() {
      try {
        if (window.electronAPI) {
          // Salva su File System
          await window.electronAPI.saveData(key, storedValue);
        } else {
          // Salva su localStorage
          window.localStorage.setItem(key, JSON.stringify(storedValue));
        }
      } catch (error) {
        console.error(`Errore salvataggio ${key}:`, error);
      }
    }

    save();
  }, [key, storedValue, loading]);

  // 3. Aggiornamento funzionale: parte sempre dall'ultimo valore, anche se chiamato dopo un'attesa
  const setValue = (value: T | ((val: T) => T)) => {
    setStoredValue((prev) => (value instanceof Function ? value(prev) : value));
  };

  return [storedValue, setValue, loading] as const;
}
