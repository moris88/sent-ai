import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailEditor } from '../../src/components/EmailEditor';
import { makeProps, stubDom } from './emailEditorProps';

vi.mock('../../src/services/ai', () => ({ generateTitle: vi.fn(), reviewDraft: vi.fn() }));
vi.mock('../../src/utils/pdf', () => ({ extractTextFromPDF: vi.fn() }));

const originalLocation = window.location;
const location = { href: '' };

describe('EmailEditor - risultato e invio', () => {
  beforeEach(() => {
    stubDom();
    location.href = '';
    Object.defineProperty(window, 'location', { value: location, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, configurable: true });
  });

  it('mostra lo scheletro durante il caricamento', () => {
    render(<EmailEditor {...makeProps({ isLoading: true, draft: { draft: 'x' } })} />);
    expect(screen.getByText('Raffinando...')).toBeInTheDocument();
    expect(screen.queryByTitle('Scarta')).not.toBeInTheDocument();
  });

  it('gestisce le azioni sul risultato raffinato', () => {
    const props = makeProps({ draft: { draft: 'x', result: 'Risultato AI' } });
    render(<EmailEditor {...props} />);
    expect(screen.getByText('Risultato Raffinato')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Scarta'));
    fireEvent.click(screen.getByTitle('Rigenera'));
    fireEvent.click(screen.getByTitle('Copia'));
    expect(props.onDiscard).toHaveBeenCalled();
    expect(props.onRegenerate).toHaveBeenCalled();
    expect(props.onCopyResult).toHaveBeenCalled();
  });

  it('approva la bozza e chiude la finestra di conferma', () => {
    const props = makeProps({ draft: { result: 'Testo', resultSource: 'write' } });
    render(<EmailEditor {...props} />);
    expect(screen.getByText(/Email scritta dall/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Approva Bozza'));
    expect(props.onUpdate).toHaveBeenCalledWith({ draft: 'Testo', result: '' });
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Chiudi'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('applica una modifica al risultato', () => {
    const props = makeProps({ draft: { result: 'Testo' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByText('Modifica Bozza'));
    const textarea = screen.getByPlaceholderText(/Descrivi la modifica/);
    expect(textarea).toHaveFocus();
    fireEvent.change(textarea, { target: { value: 'più breve' } });
    fireEvent.click(screen.getByText('Applica Modifica'));
    expect(props.onModifyResult).toHaveBeenCalledWith('più breve');
  });

  it('non applica la modifica senza chiave API e permette di annullare', () => {
    const props = makeProps({ draft: { result: 'Testo' }, checkApiKey: vi.fn(() => false) });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByText('Modifica Bozza'));
    fireEvent.change(screen.getByPlaceholderText(/Descrivi la modifica/), {
      target: { value: 'x' },
    });
    fireEvent.click(screen.getByText('Applica Modifica'));
    expect(props.onModifyResult).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(screen.queryByPlaceholderText(/Descrivi la modifica/)).not.toBeInTheDocument();
  });

  it('chiude il form di modifica al termine della modifica', () => {
    const props = makeProps({ draft: { result: 'Testo' } });
    const { rerender } = render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByText('Modifica Bozza'));
    rerender(<EmailEditor {...props} isModifying />);
    expect(screen.getByText('Modifico...')).toBeInTheDocument();
    rerender(<EmailEditor {...props} isModifying={false} />);
    expect(screen.queryByPlaceholderText(/Descrivi la modifica/)).not.toBeInTheDocument();
  });

  it('apre il client di posta con destinatari, CC e corpo in testo semplice', () => {
    const props = makeProps({ draft: { draft: '**ciao**', subject: 'Ogg' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByText('Invia Email'));
    const to = screen.getByLabelText('A');
    fireEvent.change(to, { target: { value: 'a@x.it, b@x.it' } });
    fireEvent.keyDown(to, { key: 'Enter' });
    fireEvent.change(to, { target: { value: 'a@x.it' } });
    fireEvent.keyDown(to, { key: ';' });
    fireEvent.keyDown(to, { key: 'a' });
    expect(screen.getByText('b@x.it')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Rimuovi b@x.it'));
    fireEvent.change(to, { target: { value: 'c@x.it' } });

    const cc = screen.getByLabelText('CC');
    fireEvent.change(cc, { target: { value: 'd@x.it' } });
    fireEvent.keyDown(cc, { key: ',' });
    fireEvent.change(cc, { target: { value: 'e@x.it' } });
    fireEvent.keyDown(cc, { key: 'Enter' });
    fireEvent.click(screen.getByTitle('Rimuovi e@x.it'));
    fireEvent.change(cc, { target: { value: 'f@x.it' } });

    fireEvent.click(screen.getByText('Apri client email'));
    expect(location.href).toMatch(/^mailto:a@x\.it,c@x\.it\?/);
    const params = new URLSearchParams(location.href.split('?')[1]);
    expect(params.get('subject')).toBe('Ogg');
    expect(params.get('cc')).toBe('d@x.it,f@x.it');
    expect(params.get('body')).not.toContain('**');
    expect(screen.queryByText('Apri client email')).not.toBeInTheDocument();
  });

  it('valida corpo e oggetto prima dell invio', () => {
    render(<EmailEditor {...makeProps({ draft: { result: 'Risultato' } })} />);
    fireEvent.click(screen.getByText('Invia Email'));
    fireEvent.click(screen.getByText('Apri client email'));
    expect(window.alert).toHaveBeenCalledWith("L'oggetto dell'email non può essere vuoto.");
    fireEvent.change(screen.getByLabelText(/Oggetto/), { target: { value: 'O' } });
    fireEvent.change(screen.getByLabelText(/Contenuto/), { target: { value: '  ' } });
    fireEvent.click(screen.getByText('Apri client email'));
    expect(window.alert).toHaveBeenCalledWith("Il contenuto dell'email non può essere vuoto.");
    expect(location.href).toBe('');
  });

  it('chiude il modulo di invio in tutti i modi previsti', () => {
    const { container } = render(<EmailEditor {...makeProps()} />);
    fireEvent.click(screen.getByText('Invia Email'));
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    fireEvent.click(screen.getByText('Invia Email'));
    const form = container.querySelector('form');
    if (form) fireEvent.click(screen.getAllByTitle('Chiudi')[0]);
    fireEvent.click(screen.getByText('Invia Email'));
    const backdrop = container.querySelector('[aria-hidden="true"].fixed');
    if (backdrop) fireEvent.click(backdrop);
    expect(container.querySelector('form')).toBeNull();
  });
});
