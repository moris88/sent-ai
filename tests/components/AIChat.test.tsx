import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIChat } from '../../src/components/AIChat';
import type { EmailDraft } from '../../src/types';

const { querySavedEmails } = vi.hoisted(() => ({ querySavedEmails: vi.fn() }));
vi.mock('../../src/services/ai', () => ({ querySavedEmails }));

const draft: EmailDraft = {
  id: '1',
  title: 'Titolo',
  context: 'ctx',
  draft: 'bozza',
  result: 'risultato',
  subject: 'oggetto',
  persona: 'dev',
  tone: 'friendly',
  detail: 'balanced',
  language: 'it',
  structure: '',
  keywords: '',
  generateSubject: false,
  updatedAt: 0,
};

const configure = (provider = 'gemini', apiKey = 'key') => {
  localStorage.setItem('sentai_provider', provider);
  if (apiKey) localStorage.setItem('sentai_api_key', apiKey);
  localStorage.setItem('sentai_model', 'm');
};

const send = (text: string, viaEnter = false) => {
  const input = screen.getByPlaceholderText('Chiedi qualcosa sulle tue email...');
  fireEvent.change(input, { target: { value: text } });
  if (viaEnter) fireEvent.keyDown(input, { key: 'Enter' });
  else fireEvent.click(screen.getByRole('button'));
};

describe('AIChat', () => {
  const onAiError = vi.fn();
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    querySavedEmails.mockReset();
    onAiError.mockReset();
  });

  it('non invia messaggi vuoti o senza API key', () => {
    const checkApiKey = vi.fn(() => false);
    render(<AIChat drafts={[draft]} checkApiKey={checkApiKey} onAiError={onAiError} />);
    send('   ');
    expect(checkApiKey).not.toHaveBeenCalled();
    send('domanda');
    expect(checkApiKey).toHaveBeenCalled();
    expect(querySavedEmails).not.toHaveBeenCalled();
  });

  it('segnala la configurazione mancante', async () => {
    render(<AIChat drafts={[draft]} checkApiKey={() => true} onAiError={onAiError} />);
    send('domanda');
    expect(
      await screen.findByText('Errore: API key, provider o modello non configurati.')
    ).toBeInTheDocument();
  });

  it('mostra la risposta della AI con il contesto delle bozze', async () => {
    configure('lmstudio', '');
    querySavedEmails.mockResolvedValue('Risposta AI');
    render(<AIChat drafts={[draft]} checkApiKey={() => true} onAiError={onAiError} />);
    send('cosa ho scritto?', true);
    expect(screen.getByText('cosa ho scritto?')).toBeInTheDocument();
    expect(await screen.findByText('Risposta AI')).toBeInTheDocument();
    expect(querySavedEmails).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'cosa ho scritto?', provider: 'lmstudio', model: 'm' })
    );
    expect(querySavedEmails.mock.calls[0][0].emails).toContain('Title: Titolo');
  });

  it('gestisce gli errori con e senza messaggio', async () => {
    configure();
    querySavedEmails.mockRejectedValueOnce(new Error('boom')).mockRejectedValueOnce('strano');
    render(<AIChat drafts={[]} checkApiKey={() => true} onAiError={onAiError} />);
    send('uno');
    await waitFor(() => expect(onAiError).toHaveBeenCalledWith('boom'));
    send('due');
    await waitFor(() => expect(onAiError).toHaveBeenCalledWith('Errore nel generare la risposta.'));
    expect(screen.getAllByText('Errore nel generare la risposta.')).toHaveLength(2);
  });

  it('mostra il caricamento durante la richiesta', async () => {
    configure();
    let resolve: (v: string) => void = () => {};
    querySavedEmails.mockReturnValue(
      new Promise<string>((r) => {
        resolve = r;
      })
    );
    render(<AIChat drafts={[]} checkApiKey={() => true} onAiError={onAiError} />);
    send('attendi');
    expect(await screen.findByText("L'AI sta pensando...")).toBeInTheDocument();
    resolve('fatto');
    expect(await screen.findByText('fatto')).toBeInTheDocument();
  });
});
