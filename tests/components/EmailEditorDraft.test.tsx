import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailEditor } from '../../src/components/EmailEditor';
import { reviewDraft } from '../../src/services/ai';
import { runLocalChecks } from '../../src/utils/draftChecks';
import { makeProps, setAiConfig, stubDom } from './emailEditorProps';

vi.mock('../../src/services/ai', () => ({ generateTitle: vi.fn(), reviewDraft: vi.fn() }));
vi.mock('../../src/utils/pdf', () => ({ extractTextFromPDF: vi.fn() }));
vi.mock('../../src/utils/draftChecks', () => ({ runLocalChecks: vi.fn(() => []) }));

const writeText = vi.fn();

describe('EmailEditor - bozza', () => {
  beforeEach(() => {
    stubDom();
    writeText.mockReset();
    vi.mocked(reviewDraft).mockReset();
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copia la bozza e ripristina l icona dopo 2 secondi', async () => {
    vi.useFakeTimers();
    writeText.mockResolvedValue(undefined);
    render(<EmailEditor {...makeProps({ draft: { draft: 'ciao' } })} />);
    await act(async () => {
      fireEvent.click(screen.getByTitle('Copia la bozza negli appunti'));
    });
    expect(writeText).toHaveBeenCalledWith('ciao');
    expect(screen.getByText('Copiato!')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText('Copiato!')).not.toBeInTheDocument();
  });

  it('avvisa se la copia fallisce', async () => {
    writeText.mockRejectedValue(new Error('no'));
    render(<EmailEditor {...makeProps({ draft: { draft: 'ciao' } })} />);
    fireEvent.click(screen.getByTitle('Copia la bozza negli appunti'));
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Impossibile copiare la bozza negli appunti.')
    );
  });

  it('svuota la bozza e la aggiorna dall editor', () => {
    const props = makeProps({ draft: { draft: 'ciao' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Svuota la bozza'));
    expect(props.onUpdate).toHaveBeenCalledWith({ draft: '' });
    fireEvent.change(screen.getByPlaceholderText(/Scrivi qui la tua bozza/), {
      target: { value: 'nuovo' },
    });
    expect(props.onUpdate).toHaveBeenCalledWith({ draft: 'nuovo' });
  });

  it('inserisce header e footer con i nomi indicati', () => {
    const props = makeProps({ draft: { draft: 'corpo' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Inserisci header e footer'));
    fireEvent.change(screen.getByLabelText('Nome Cliente'), { target: { value: 'Mario' } });
    fireEvent.change(screen.getByLabelText('Il tuo nome'), { target: { value: 'Luca' } });
    fireEvent.click(screen.getByText('Inserisci'));
    expect(props.onUpdate).toHaveBeenCalledWith({
      draft: 'Ciao Mario\n\ncorpo\n\nBuona giornata,\nLuca',
    });
    expect(localStorage.getItem('sentai_sender_name')).toBe('Luca');
  });

  it('usa i segnaposto nel template se i campi sono vuoti e permette di annullare', () => {
    const props = makeProps();
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Inserisci header e footer'));
    fireEvent.click(screen.getByText('Inserisci'));
    expect(props.onUpdate).toHaveBeenCalledWith({
      draft: 'Ciao [nome Cliente]\n\n[testo]\n\nBuona giornata,\n[mio nome]',
    });
    expect(localStorage.getItem('sentai_sender_name')).toBe('');
    fireEvent.click(screen.getByTitle('Inserisci header e footer'));
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(screen.queryByLabelText('Nome Cliente')).not.toBeInTheDocument();
  });

  it('inserisce una frase predefinita alla posizione del cursore', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const props = makeProps({ draft: { draft: 'AB' } });
    render(<EmailEditor {...props} />);
    const textarea = screen.getByPlaceholderText<HTMLTextAreaElement>(/Scrivi qui la tua bozza/);
    textarea.setSelectionRange(1, 1);
    fireEvent.click(screen.getByText('Chiusura'));
    expect(props.onUpdate).toHaveBeenCalledWith({ draft: 'ACordiali saluti,\nB' });
    raf.mockRestore();
  });

  it('crea, usa ed elimina una frase personalizzata', () => {
    const props = makeProps();
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Aggiungi una frase personalizzata'));
    const save = screen.getByText('Salva frase');
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Nome breve/), { target: { value: 'Mia' } });
    fireEvent.change(screen.getByPlaceholderText(/Testo da inserire/), {
      target: { value: 'Testo mio' },
    });
    fireEvent.click(save);
    expect(JSON.parse(localStorage.getItem('sentai_custom_snippets') ?? '[]')).toHaveLength(1);
    fireEvent.click(screen.getByText('Mia'));
    expect(props.onUpdate).toHaveBeenCalledWith({ draft: 'Testo mio' });
    fireEvent.click(screen.getByTitle('Elimina frase'));
    expect(screen.queryByText('Mia')).not.toBeInTheDocument();
    expect(localStorage.getItem('sentai_custom_snippets')).toBe('[]');
  });

  it('annulla il form frase e tollera JSON non valido nello storage', () => {
    localStorage.setItem('sentai_custom_snippets', '{rotto');
    render(<EmailEditor {...makeProps()} />);
    fireEvent.click(screen.getByTitle('Aggiungi una frase personalizzata'));
    fireEvent.click(screen.getByRole('button', { name: 'Annulla' }));
    expect(screen.queryByText('Salva frase')).not.toBeInTheDocument();
  });

  it('mostra l esito positivo del controllo e lo chiude', () => {
    render(<EmailEditor {...makeProps({ draft: { draft: 'ok' } })} />);
    fireEvent.click(screen.getByText('Check Bozza'));
    expect(screen.getByText('Nessun problema trovato nella bozza.')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Chiudi il controllo bozza'));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('elenca i problemi trovati dal controllo', () => {
    vi.mocked(runLocalChecks).mockReturnValueOnce([
      { id: 'a', severity: 'error', message: 'Errore grave' },
      { id: 'b', severity: 'info', message: 'Nota' },
    ]);
    render(<EmailEditor {...makeProps({ draft: { draft: 'ok' } })} />);
    fireEvent.click(screen.getByText('Check Bozza'));
    expect(screen.getByText('Errore grave')).toBeInTheDocument();
    expect(screen.getByText('Nota')).toBeInTheDocument();
  });

  it('richiede i suggerimenti AI e li mostra', async () => {
    setAiConfig();
    vi.mocked(reviewDraft).mockResolvedValue('  Suggerimento utile  ');
    render(<EmailEditor {...makeProps({ draft: { draft: 'ok' } })} />);
    fireEvent.click(screen.getByText('Check Bozza'));
    fireEvent.click(screen.getByText('Suggerimenti AI'));
    expect(await screen.findByText('Suggerimento utile')).toBeInTheDocument();
    expect(reviewDraft).toHaveBeenCalledWith(
      expect.objectContaining({ draft: 'ok', provider: 'openai', model: 'gpt' })
    );
  });

  it('mostra un messaggio se la revisione AI è vuota', async () => {
    setAiConfig('lmstudio', '');
    vi.mocked(reviewDraft).mockResolvedValue('   ');
    render(<EmailEditor {...makeProps({ draft: { draft: 'ok' } })} />);
    fireEvent.click(screen.getByText('Check Bozza'));
    fireEvent.click(screen.getByText('Suggerimenti AI'));
    expect(await screen.findByText('Nessun suggerimento.')).toBeInTheDocument();
  });

  it('segnala configurazione mancante ed errori della revisione AI', async () => {
    const props = makeProps({ draft: { draft: 'ok' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByText('Check Bozza'));
    fireEvent.click(screen.getByText('Suggerimenti AI'));
    expect(props.onAiError).toHaveBeenCalledWith(
      'Configura provider, chiave e modello nelle impostazioni.'
    );

    setAiConfig();
    vi.mocked(reviewDraft).mockRejectedValueOnce(new Error('rete'));
    fireEvent.click(screen.getByText('Suggerimenti AI'));
    await waitFor(() => expect(props.onAiError).toHaveBeenCalledWith('rete'));
    await screen.findByText('Suggerimenti AI');

    vi.mocked(reviewDraft).mockRejectedValueOnce(42);
    fireEvent.click(screen.getByText('Suggerimenti AI'));
    await waitFor(() =>
      expect(props.onAiError).toHaveBeenCalledWith('Errore durante la richiesta di suggerimenti.')
    );
  });

  it('gestisce la sezione di scrittura con AI', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return 0;
    });
    const props = makeProps({ draft: { writeInstructions: 'scrivi' } });
    const { rerender } = render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText(/Il contesto è vuoto/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Indicazioni per l/), { target: { value: 'x' } });
    expect(props.onUpdate).toHaveBeenCalledWith({ writeInstructions: 'x' });
    fireEvent.click(screen.getByText('Scrivi con AI'));
    expect(props.onWrite).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Aggiungi contesto'));
    expect(screen.getByPlaceholderText(/contesto della conversazione/)).toBeInTheDocument();

    rerender(<EmailEditor {...props} draft={{ ...props.draft, context: 'c' }} isWriting />);
    expect(screen.getByText('Rivedi contesto')).toBeInTheDocument();
    expect(screen.getByText('Scrivendo...')).toBeInTheDocument();
    raf.mockRestore();
  });

  it('esegue le azioni principali della bozza', () => {
    const props = makeProps({ draft: { draft: 'ok' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByText('Aggiungi a Contesto'));
    expect(props.onContinueThread).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Raffina Bozza'));
    expect(props.onRefine).toHaveBeenCalled();
  });
});
