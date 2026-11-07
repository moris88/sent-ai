import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDarkMode } from '../../src/hooks/useDarkMode';

const mockSystemDark = (matches: boolean) => {
  vi.mocked(window.matchMedia).mockImplementationOnce((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

describe('useDarkMode', () => {
  afterEach(() => document.documentElement.classList.remove('dark'));

  it('usa il tema salvato in localStorage', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('dark');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('usa la preferenza di sistema scura se non esiste un tema salvato', () => {
    mockSystemDark(true);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('dark');
  });

  it('usa il tema chiaro se il sistema non preferisce il tema scuro', () => {
    mockSystemDark(false);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.theme).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('inverte il tema e aggiorna DOM e localStorage', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useDarkMode());
    act(() => result.current.toggleTheme());
    expect(result.current.isDark).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
