import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStorage } from '../../src/hooks/useStorage';

type ElectronApi = NonNullable<Window['electronAPI']>;

const stubElectron = (loadData: ElectronApi['loadData'], saveData: ElectronApi['saveData']) => {
  window.electronAPI = { loadData, saveData };
};

describe('useStorage', () => {
  afterEach(() => {
    delete window.electronAPI;
    vi.restoreAllMocks();
  });

  describe('web (localStorage)', () => {
    it('usa il valore iniziale se non ci sono dati salvati', async () => {
      const { result } = renderHook(() => useStorage('k', 1));
      await waitFor(() => expect(result.current[2]).toBe(false));
      expect(result.current[0]).toBe(1);
      await waitFor(() => expect(localStorage.getItem('k')).toBe('1'));
    });

    it('carica e salva i dati in localStorage', async () => {
      localStorage.setItem('k', JSON.stringify({ a: 1 }));
      const { result } = renderHook(() => useStorage('k', { a: 0 }));
      await waitFor(() => expect(result.current[0]).toEqual({ a: 1 }));

      act(() => result.current[1]((prev) => ({ a: prev.a + 1 })));
      await waitFor(() => expect(localStorage.getItem('k')).toBe('{"a":2}'));

      act(() => result.current[1]({ a: 10 }));
      expect(result.current[0]).toEqual({ a: 10 });
    });

    it('registra un errore se il JSON salvato non è valido', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      localStorage.setItem('k', '{non valido');
      const { result } = renderHook(() => useStorage('k', 0));
      await waitFor(() => expect(result.current[2]).toBe(false));
      expect(errorSpy).toHaveBeenCalledWith('Errore caricamento k:', expect.any(Error));
    });

    it('registra un errore se il salvataggio fallisce', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      renderHook(() => useStorage('k', 0));
      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith('Errore salvataggio k:', expect.any(Error))
      );
    });
  });

  describe('desktop (electronAPI)', () => {
    it('carica dal file system e salva le modifiche', async () => {
      const saveData = vi.fn<ElectronApi['saveData']>().mockResolvedValue({ success: true });
      stubElectron(vi.fn().mockResolvedValue([1, 2]), saveData);
      const { result } = renderHook(() => useStorage<number[]>('drafts', []));
      await waitFor(() => expect(result.current[0]).toEqual([1, 2]));
      await waitFor(() => expect(saveData).toHaveBeenCalledWith('drafts', [1, 2]));

      act(() => result.current[1]((prev) => [...prev, 3]));
      await waitFor(() => expect(saveData).toHaveBeenLastCalledWith('drafts', [1, 2, 3]));
    });

    it('mantiene il valore iniziale se il file non esiste', async () => {
      stubElectron(vi.fn().mockResolvedValue(null), vi.fn().mockResolvedValue({ success: true }));
      const { result } = renderHook(() => useStorage('drafts', 'iniziale'));
      await waitFor(() => expect(result.current[2]).toBe(false));
      expect(result.current[0]).toBe('iniziale');
    });

    it('registra gli errori di caricamento e salvataggio', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      stubElectron(
        vi.fn().mockRejectedValue(new Error('lettura')),
        vi.fn().mockRejectedValue(new Error('scrittura'))
      );
      const { result } = renderHook(() => useStorage('drafts', 0));
      await waitFor(() => expect(result.current[2]).toBe(false));
      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith('Errore salvataggio drafts:', expect.any(Error))
      );
      expect(errorSpy).toHaveBeenCalledWith('Errore caricamento drafts:', expect.any(Error));
    });
  });
});
