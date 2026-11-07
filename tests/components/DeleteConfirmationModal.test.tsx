import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DeleteConfirmationModal } from '../../src/components/DeleteConfirmationModal';

describe('DeleteConfirmationModal', () => {
  it('non mostra nulla quando è chiuso', () => {
    const { container } = render(
      <DeleteConfirmationModal isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('conferma o annulla l eliminazione', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<DeleteConfirmationModal isOpen onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    fireEvent.click(screen.getByRole('button', { name: 'Elimina' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
