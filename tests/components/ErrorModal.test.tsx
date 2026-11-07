import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorModal } from '../../src/components/ErrorModal';

describe('ErrorModal', () => {
  it('non mostra nulla senza messaggio', () => {
    const { container } = render(<ErrorModal message={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra il messaggio e chiude con il pulsante Chiudi', () => {
    const onClose = vi.fn();
    render(<ErrorModal message="Chiave API non valida" onClose={onClose} />);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByText('Chiave API non valida')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Chiudi', { selector: 'button' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chiude cliccando sullo sfondo', () => {
    const onClose = vi.fn();
    render(<ErrorModal message="Errore" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Chiudi finestra' }));
    expect(onClose).toHaveBeenCalled();
  });
});
