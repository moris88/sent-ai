import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PrivacyNotice } from '../../src/components/PrivacyNotice';
import { notifyRedactions } from '../../src/utils/redact';

describe('PrivacyNotice (rami aggiuntivi)', () => {
  it('senza bozza mostra il primo campo non vuoto', () => {
    render(<PrivacyNotice />);
    act(() =>
      notifyRedactions({
        summary: { EMAIL: 1 },
        sentFields: [
          { field: 'context', text: '   ' },
          { field: 'question', text: 'Chi è [EMAIL_1]?' },
        ],
      })
    );
    expect(screen.getByText("Testo inviato all'AI (Domanda):")).toBeInTheDocument();
  });

  it('usa il nome del campo se non ha etichetta', () => {
    render(<PrivacyNotice />);
    act(() =>
      notifyRedactions({ summary: { EMAIL: 1 }, sentFields: [{ field: 'ignoto', text: 'x' }] })
    );
    expect(screen.getByText("Testo inviato all'AI (ignoto):")).toBeInTheDocument();
  });

  it('non mostra nulla se tutti i campi sono vuoti', () => {
    const { container } = render(<PrivacyNotice />);
    act(() =>
      notifyRedactions({
        summary: {},
        sentFields: [
          { field: 'id', text: 'abc' },
          { field: 'draft', text: '' },
        ],
      })
    );
    expect(container).toBeEmptyDOMElement();
  });
});
