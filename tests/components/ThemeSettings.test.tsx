import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeSettings } from '../../src/components/ThemeSettings';
import { loadPrimaryColor } from '../../src/utils/theme';

describe('ThemeSettings', () => {
  it('salva il colore scelto da un preset', () => {
    render(<ThemeSettings />);

    fireEvent.click(screen.getByRole('button', { name: 'Colore Verde' }));

    expect(loadPrimaryColor()).toBe('#059669');
    expect(screen.getByRole('button', { name: 'Colore Verde' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('ripristina il colore di default', () => {
    localStorage.setItem('sentai_primary_color', '#db2777');
    render(<ThemeSettings />);

    fireEvent.click(screen.getByRole('button', { name: /Ripristina/ }));

    expect(loadPrimaryColor()).toBeNull();
    expect(screen.getByRole('button', { name: 'Colore Blu' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  it('accetta un colore personalizzato dal selettore', () => {
    render(<ThemeSettings />);

    fireEvent.change(screen.getByLabelText('Colore personalizzato'), {
      target: { value: '#123456' },
    });

    expect(loadPrimaryColor()).toBe('#123456');
  });
});
