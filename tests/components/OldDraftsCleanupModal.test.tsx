import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OldDraftsCleanupModal from '../../src/components/OldDraftsCleanupModal';

describe('OldDraftsCleanupModal', () => {
  it('non renderizza nulla se chiuso', () => {
    const { container } = render(
      <OldDraftsCleanupModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        expiredCount={1}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra il conteggio e gestisce annulla e conferma', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(
      <OldDraftsCleanupModal isOpen onClose={onClose} onConfirm={onConfirm} expiredCount={3} />
    );
    expect(screen.getByText(/Ci sono 3 bozze scadute/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ok, procedi' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
