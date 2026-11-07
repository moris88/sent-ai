import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrivacyNotice } from '../../src/components/PrivacyNotice';
import { notifyRedactions } from '../../src/utils/redact';

describe('PrivacyNotice', () => {
  it('non mostra nulla finché non ci sono invii oscurati', () => {
    const { container } = render(<PrivacyNotice />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra solo il testo inviato, senza l id', () => {
    render(<PrivacyNotice />);

    act(() =>
      notifyRedactions({
        summary: { EMAIL: 1 },
        sentFields: [
          { field: 'id', text: '456ad09f-86b3' },
          { field: 'draft', text: 'Scrivi a [EMAIL_1]' },
        ],
      })
    );

    expect(screen.getByText("Dati oscurati prima dell'invio all'AI")).toBeInTheDocument();
    expect(screen.getByText('Scrivi a [EMAIL_1]')).toBeInTheDocument();
    expect(screen.queryByText('456ad09f-86b3')).not.toBeInTheDocument();
  });

  it('chiude l avviso con il pulsante dedicato', () => {
    render(<PrivacyNotice />);

    act(() =>
      notifyRedactions({
        summary: { TOKEN: 1 },
        sentFields: [{ field: 'draft', text: '[TOKEN_1]' }],
      })
    );
    fireEvent.click(screen.getByRole('button', { name: "Chiudi l'avviso" }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
