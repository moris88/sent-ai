import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Import dinamico dopo vi.stubEnv: VITE_APP viene letto a ogni render, il reset evita cache tra i casi.
const loadHook = async (app: string) => {
  vi.stubEnv('VITE_APP', app);
  vi.resetModules();
  const mod = await import('../../src/hooks/useAppHooks');
  return mod.useAppHooks;
};

describe('useAppHooks', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.electronAPI;
    document.documentElement.classList.remove('dark');
  });

  it('usa useDrafts e useDarkMode sul web', async () => {
    const useAppHooks = await loadHook('web');
    const { result } = renderHook(() => useAppHooks());
    expect(result.current.loading).toBe(false);
    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.isDark).toBe(false);

    act(() => result.current.toggleTheme());
    expect(result.current.isDark).toBe(true);

    let id = '';
    act(() => {
      id = result.current.createDraft();
    });
    act(() => result.current.updateDraft(id, { title: 'Web' }));
    expect(result.current.drafts.find((d) => d.id === id)?.title).toBe('Web');
    act(() => result.current.deleteDraft(id));
    expect(result.current.drafts).toHaveLength(1);
  });

  it('usa useStorage su desktop', async () => {
    const saveData = vi.fn().mockResolvedValue({ success: true });
    window.electronAPI = { loadData: vi.fn().mockResolvedValue(null), saveData };
    const useAppHooks = await loadHook('desktop');
    const { result } = renderHook(() => useAppHooks());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.drafts).toEqual([]);
    expect(result.current.isDark).toBe(false);
    result.current.toggleTheme();

    let id = '';
    act(() => {
      id = result.current.createDraft();
    });
    act(() => {
      result.current.createDraft();
    });
    expect(result.current.drafts).toHaveLength(2);

    act(() => result.current.updateDraft(id, { title: 'Desktop' }));
    expect(result.current.drafts[0].title).toBe('Desktop');
    expect(result.current.drafts[1].title).toBe('');

    act(() => result.current.deleteDraft(id));
    expect(result.current.drafts).toHaveLength(1);
    await waitFor(() => expect(saveData).toHaveBeenCalled());
  });
});
