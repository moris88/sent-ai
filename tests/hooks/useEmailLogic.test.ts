import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEmailLogic } from '../../src/hooks/useEmailLogic';
import { generateSubject, refineEmail, reviseEmail, writeEmail } from '../../src/services/ai';
import type { EmailDraft } from '../../src/types';

vi.mock('../../src/services/ai', () => ({
  refineEmail: vi.fn(),
  writeEmail: vi.fn(),
  reviseEmail: vi.fn(),
  generateSubject: vi.fn(),
}));

const makeDraft = (overrides: Partial<EmailDraft> = {}): EmailDraft => ({
  id: 'a',
  title: '',
  context: '',
  draft: 'Bozza',
  result: '',
  subject: '',
  persona: 'dev',
  tone: 'friendly',
  detail: 'balanced',
  language: 'it',
  structure: 'paragraphs',
  keywords: '',
  generateSubject: false,
  updatedAt: 0,
  ...overrides,
});

const clipboard = {
  write: vi.fn(),
  writeText: vi.fn(),
  readText: vi.fn(),
};

const setup = (overrides: Partial<EmailDraft> = {}) => {
  const update = vi.fn();
  const openSettings = vi.fn();
  const onAiError = vi.fn();
  const { result } = renderHook(() =>
    useEmailLogic(makeDraft(overrides), update, openSettings, onAiError)
  );
  return { result, update, openSettings, onAiError };
};

describe('useEmailLogic', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(public items: Record<string, Blob>) {}
      }
    );
    Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('handleRefine', () => {
    it('non fa nulla senza bozza', async () => {
      const { result } = setup({ draft: '' });
      await act(() => result.current.handleRefine());
      expect(refineEmail).not.toHaveBeenCalled();
    });

    it('usa la configurazione salvata e genera anche l oggetto', async () => {
      localStorage.setItem('sentai_provider', 'openai');
      localStorage.setItem('sentai_api_key', 'key');
      localStorage.setItem('sentai_model', 'gpt');
      localStorage.setItem('sentai_additional_prompt', 'extra');
      vi.mocked(refineEmail).mockResolvedValue('Raffinata');
      vi.mocked(generateSubject).mockResolvedValue('Oggetto');
      const { result, update } = setup({ generateSubject: true });
      await act(() => result.current.handleRefine());
      expect(refineEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          apiKey: 'key',
          model: 'gpt',
          prompt: 'extra',
        })
      );
      expect(update).toHaveBeenCalledWith({ result: 'Raffinata', resultSource: 'refine' });
      expect(update).toHaveBeenCalledWith({ subject: 'Oggetto' });
      expect(result.current.isLoading).toBe(false);
    });

    it('non rigenera l oggetto se già presente', async () => {
      vi.mocked(refineEmail).mockResolvedValue('R');
      const { result } = setup({ generateSubject: true, subject: 'Esistente' });
      await act(() => result.current.handleRefine());
      expect(generateSubject).not.toHaveBeenCalled();
    });

    it('apre le impostazioni se manca la API key', async () => {
      vi.mocked(refineEmail).mockRejectedValue(new Error('API Key non trovata'));
      const { result, onAiError, openSettings } = setup({ generateSubject: true });
      await act(() => result.current.handleRefine());
      expect(onAiError).toHaveBeenCalledWith('API Key non trovata');
      expect(openSettings).toHaveBeenCalledWith(true);
      expect(generateSubject).not.toHaveBeenCalled();
    });

    it('usa il messaggio predefinito per errori non Error', async () => {
      vi.mocked(refineEmail).mockRejectedValue({ message: 'altro' });
      const { result, onAiError, openSettings } = setup();
      await act(() => result.current.handleRefine());
      expect(onAiError).toHaveBeenCalledWith("Errore durante la generazione dell'email.");
      expect(openSettings).not.toHaveBeenCalled();
    });

    it('segnala gli errori nella generazione dell oggetto', async () => {
      vi.mocked(refineEmail).mockResolvedValue('R');
      vi.mocked(generateSubject).mockRejectedValueOnce(new Error('oggetto ko'));
      const first = setup({ generateSubject: true });
      await act(() => first.result.current.handleRefine());
      expect(first.onAiError).toHaveBeenCalledWith('oggetto ko');

      vi.mocked(generateSubject).mockRejectedValueOnce('stringa');
      const second = setup({ generateSubject: true });
      await act(() => second.result.current.handleRefine());
      expect(second.onAiError).toHaveBeenCalledWith("Errore durante la generazione dell'oggetto.");
    });
  });

  describe('handleWrite e handleRegenerate', () => {
    it('non scrive senza istruzioni', async () => {
      const { result } = setup({ writeInstructions: '   ' });
      await act(() => result.current.handleWrite());
      expect(writeEmail).not.toHaveBeenCalled();
    });

    it('scrive l email con le istruzioni', async () => {
      vi.mocked(writeEmail).mockResolvedValue('Scritta');
      vi.mocked(generateSubject).mockResolvedValue('Ogg');
      const { result, update } = setup({ writeInstructions: ' scrivi ', generateSubject: true });
      await act(() => result.current.handleWrite());
      expect(writeEmail).toHaveBeenCalledWith(
        expect.objectContaining({ instructions: 'scrivi', provider: 'gemini', prompt: '' })
      );
      expect(update).toHaveBeenCalledWith({ result: 'Scritta', resultSource: 'write' });
      expect(result.current.isWriting).toBe(false);
    });

    it('gestisce gli errori di scrittura', async () => {
      vi.mocked(writeEmail).mockRejectedValueOnce(new Error('ko'));
      const first = setup({ writeInstructions: 'x' });
      await act(() => first.result.current.handleWrite());
      expect(first.onAiError).toHaveBeenCalledWith('ko');

      vi.mocked(writeEmail).mockRejectedValueOnce(42);
      const second = setup({ writeInstructions: 'x' });
      await act(() => second.result.current.handleWrite());
      expect(second.onAiError).toHaveBeenCalledWith("Errore durante la scrittura dell'email.");
    });

    it('rigenera con la modalità che ha prodotto il risultato', async () => {
      vi.mocked(writeEmail).mockResolvedValue('W');
      vi.mocked(refineEmail).mockResolvedValue('R');
      const write = setup({ resultSource: 'write', writeInstructions: 'x' });
      await act(() => write.result.current.handleRegenerate());
      expect(writeEmail).toHaveBeenCalled();
      const refine = setup({ resultSource: 'refine' });
      await act(() => refine.result.current.handleRegenerate());
      expect(refineEmail).toHaveBeenCalled();
    });
  });

  describe('handleGenerateSubject', () => {
    it('genera l oggetto e gestisce gli errori', async () => {
      vi.mocked(generateSubject).mockResolvedValueOnce('Ogg');
      const ok = setup({ result: 'Testo' });
      await act(() => ok.result.current.handleGenerateSubject());
      expect(ok.update).toHaveBeenCalledWith({ subject: 'Ogg' });

      vi.mocked(generateSubject).mockRejectedValueOnce(new Error('ko'));
      const ko = setup();
      await act(() => ko.result.current.handleGenerateSubject());
      expect(ko.onAiError).toHaveBeenCalledWith('ko');

      vi.mocked(generateSubject).mockRejectedValueOnce(null);
      const other = setup();
      await act(() => other.result.current.handleGenerateSubject());
      expect(other.onAiError).toHaveBeenCalledWith("Errore durante la generazione dell'oggetto.");
      expect(other.result.current.isGeneratingSubject).toBe(false);
    });
  });

  describe('handleModifyResult', () => {
    it('ignora richieste senza risultato o istruzioni', async () => {
      const { result } = setup({ result: '' });
      await act(() => result.current.handleModifyResult('cambia'));
      const withResult = setup({ result: 'R' });
      await act(() => withResult.result.current.handleModifyResult('  '));
      expect(reviseEmail).not.toHaveBeenCalled();
    });

    it('modifica il risultato e gestisce gli errori', async () => {
      vi.mocked(reviseEmail).mockResolvedValueOnce('Rivisto');
      const ok = setup({ result: 'R' });
      await act(() => ok.result.current.handleModifyResult('accorcia'));
      expect(ok.update).toHaveBeenCalledWith({ result: 'Rivisto' });

      vi.mocked(reviseEmail).mockRejectedValueOnce(new Error('ko'));
      const ko = setup({ result: 'R' });
      await act(() => ko.result.current.handleModifyResult('accorcia'));
      expect(ko.onAiError).toHaveBeenCalledWith('ko');

      vi.mocked(reviseEmail).mockRejectedValueOnce('x');
      const other = setup({ result: 'R' });
      await act(() => other.result.current.handleModifyResult('accorcia'));
      expect(other.onAiError).toHaveBeenCalledWith("Errore durante la modifica dell'email.");
      expect(other.result.current.isModifying).toBe(false);
    });
  });

  describe('appunti', () => {
    it('copia l email in HTML e testo semplice', async () => {
      clipboard.write.mockResolvedValue(undefined);
      const { result } = setup({ result: '**Ciao**' });
      await act(() => result.current.copyToClipboard());
      expect(clipboard.write).toHaveBeenCalled();
      expect(alert).toHaveBeenCalledWith('Email copiata negli appunti!');
    });

    it('ripiega su writeText se write fallisce', async () => {
      clipboard.write.mockRejectedValue(new Error('non supportato'));
      clipboard.writeText.mockResolvedValue(undefined);
      const { result } = setup({ result: 'Ciao' });
      await act(() => result.current.copyToClipboard());
      expect(clipboard.writeText).toHaveBeenCalled();
    });

    it('copia l oggetto', () => {
      const { result } = setup({ subject: 'Ogg' });
      result.current.copySubjectToClipboard();
      expect(clipboard.writeText).toHaveBeenCalledWith('Ogg');
      expect(alert).toHaveBeenCalledWith('Oggetto copiato negli appunti!');
    });

    it('incolla nel contesto e nella bozza', async () => {
      clipboard.readText.mockResolvedValue('incollato');
      const empty = setup({ context: '', draft: '' });
      await act(() => empty.result.current.pasteFromClipboard('context'));
      await act(() => empty.result.current.pasteFromClipboard('draft'));
      expect(empty.update).toHaveBeenCalledWith({ context: 'incollato' });
      expect(empty.update).toHaveBeenCalledWith({ draft: 'incollato' });

      const filled = setup({ context: 'C', draft: 'D' });
      await act(() => filled.result.current.pasteFromClipboard('context'));
      await act(() => filled.result.current.pasteFromClipboard('draft'));
      expect(filled.update).toHaveBeenCalledWith({ context: 'C\nincollato' });
      expect(filled.update).toHaveBeenCalledWith({ draft: 'D\nincollato' });
    });

    it('avvisa se non può leggere gli appunti', async () => {
      clipboard.readText.mockRejectedValue(new Error('negato'));
      const { result } = setup();
      await act(() => result.current.pasteFromClipboard('draft'));
      expect(alert).toHaveBeenCalledWith(
        'Impossibile accedere agli appunti. Verifica i permessi del browser/pc.'
      );
    });
  });
});
