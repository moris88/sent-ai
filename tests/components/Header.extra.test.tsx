import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const loadHeader = async () => (await import('../../src/components/Header')).Header;

describe('Header (rami aggiuntivi)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    document.documentElement.classList.remove('dark');
  });

  it('senza callback nasconde menu e impostazioni', async () => {
    const Header = await loadHeader();
    render(<Header />);
    // resta solo il pulsante del tema
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('mostra la versione e gestisce menu, tema e impostazioni', async () => {
    vi.stubEnv('VITE_RELEASE', '1.2.3');
    vi.stubEnv('VITE_DATA_RELEASE', '2026-01-01');
    vi.resetModules();
    const Header = await loadHeader();
    const toggleSidebar = vi.fn();
    const onOpenSettings = vi.fn();
    render(<Header isSidebarOpen toggleSidebar={toggleSidebar} onOpenSettings={onOpenSettings} />);

    expect(screen.getByText('SentAI (1.2.3 - 2026-01-01)')).toBeInTheDocument();
    const [menu, theme, settings] = screen.getAllByRole('button');
    fireEvent.click(menu);
    fireEvent.click(settings);
    expect(toggleSidebar).toHaveBeenCalled();
    expect(onOpenSettings).toHaveBeenCalled();

    fireEvent.click(theme);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    fireEvent.click(theme);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('senza variabili di versione mostra solo il nome', async () => {
    vi.stubEnv('VITE_RELEASE', undefined);
    vi.stubEnv('VITE_DATA_RELEASE', undefined);
    vi.resetModules();
    const Header = await loadHeader();
    render(<Header />);
    expect(screen.getByRole('heading', { level: 1 }).textContent?.trim()).toBe('SentAI');
  });
});
