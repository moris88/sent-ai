import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('chiama onCreate quando si crea la prima bozza', () => {
    const onCreate = vi.fn();
    render(<EmptyState onCreate={onCreate} onOpenSettings={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Crea la prima bozza/ }));

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('apre le impostazioni dalla barra in alto', () => {
    const onOpenSettings = vi.fn();
    render(<EmptyState onCreate={vi.fn()} onOpenSettings={onOpenSettings} />);

    const settingsIcon = document.querySelector('.lucide-settings');
    fireEvent.click(settingsIcon?.closest('button') as HTMLButtonElement);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
  });

  it('mostra il credito con il link all autore', () => {
    render(<EmptyState onCreate={vi.fn()} onOpenSettings={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Maurizio Tolomeo' })).toHaveAttribute(
      'href',
      'https://www.mauriziotolomeo.it'
    );
  });
});
