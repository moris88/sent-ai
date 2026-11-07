import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DesktopAppToast } from '../../src/components/DesktopAppToast';

const KEY = 'sentai_desktop_toast_dismissed';

describe('DesktopAppToast', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP', 'web');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('si mostra sul web e si chiude salvando la scelta', () => {
    render(<DesktopAppToast />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Chiudi'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(localStorage.getItem(KEY)).toBe('true');
  });

  it('resta nascosto se già chiuso in passato', () => {
    localStorage.setItem(KEY, 'true');
    const { container } = render(<DesktopAppToast />);
    expect(container).toBeEmptyDOMElement();
  });

  it('non si mostra nella versione desktop', () => {
    vi.stubEnv('VITE_APP', 'desktop');
    const { container } = render(<DesktopAppToast />);
    expect(container).toBeEmptyDOMElement();
  });

  it('gestisce gli errori del localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloccato');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloccato');
    });
    render(<DesktopAppToast />);
    fireEvent.click(screen.getByTitle('Chiudi'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
