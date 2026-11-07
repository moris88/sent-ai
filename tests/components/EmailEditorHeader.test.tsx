import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailEditor } from '../../src/components/EmailEditor';
import { generateTitle } from '../../src/services/ai';
import { extractTextFromPDF } from '../../src/utils/pdf';
import { makeProps, setAiConfig, stubDom } from './emailEditorProps';

vi.mock('../../src/services/ai', () => ({ generateTitle: vi.fn(), reviewDraft: vi.fn() }));
vi.mock('../../src/utils/pdf', () => ({ extractTextFromPDF: vi.fn() }));

const getFileInputs = (container: HTMLElement) =>
  container.querySelectorAll<HTMLInputElement>('input[type="file"]');

describe('EmailEditor - titolo, oggetto, contesto e file', () => {
  beforeEach(() => {
    stubDom();
    vi.mocked(generateTitle).mockReset();
  });

  it('aggiorna il titolo digitato', () => {
    const props = makeProps();
    render(<EmailEditor {...props} />);
    fireEvent.change(screen.getByPlaceholderText(/Titolo della conversazione/), {
      target: { value: 'Nuovo' },
    });
    expect(props.onUpdate).toHaveBeenCalledWith({ title: 'Nuovo' });
  });

  it('genera il titolo con AI', async () => {
    setAiConfig();
    vi.mocked(generateTitle).mockResolvedValue('Titolo AI');
    const props = makeProps({ draft: { context: 'c', draft: 'd' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Genera titolo con AI'));
    await waitFor(() => expect(props.onUpdate).toHaveBeenCalledWith({ title: 'Titolo AI' }));
    expect(generateTitle).toHaveBeenCalledWith('c', 'd', 'openai', 'key', 'gpt');
  });

  it('non genera il titolo se la chiave API manca', () => {
    const props = makeProps({ checkApiKey: vi.fn(() => false) });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Genera titolo con AI'));
    expect(generateTitle).not.toHaveBeenCalled();
  });

  it('non genera il titolo se la configurazione è incompleta', async () => {
    render(<EmailEditor {...makeProps()} />);
    fireEvent.click(screen.getByTitle('Genera titolo con AI'));
    await waitFor(() => expect(screen.getByTitle('Genera titolo con AI')).not.toBeDisabled());
    expect(generateTitle).not.toHaveBeenCalled();
  });

  it('segnala gli errori nella generazione del titolo', async () => {
    setAiConfig('lmstudio', '');
    vi.mocked(generateTitle).mockRejectedValueOnce(new Error('boom'));
    const props = makeProps();
    render(<EmailEditor {...props} />);
    const button = screen.getByTitle('Genera titolo con AI');
    fireEvent.click(button);
    await waitFor(() => expect(props.onAiError).toHaveBeenCalledWith('boom'));
    await waitFor(() => expect(button).not.toBeDisabled());

    vi.mocked(generateTitle).mockRejectedValueOnce('stringa');
    fireEvent.click(button);
    await waitFor(() =>
      expect(props.onAiError).toHaveBeenCalledWith('Errore durante la generazione del titolo.')
    );
  });

  it('gestisce la sezione oggetto', () => {
    const props = makeProps({ draft: { generateSubject: true, subject: 'Ogg' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Genera oggetto con AI'));
    expect(props.onGenerateSubject).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Copia l'oggetto negli appunti"));
    expect(props.onCopySubject).toHaveBeenCalled();
    fireEvent.click(screen.getByTitle("Elimina l'oggetto"));
    expect(props.onUpdate).toHaveBeenCalledWith({ subject: '' });
    fireEvent.change(screen.getByPlaceholderText("Oggetto dell'email..."), {
      target: { value: 'X' },
    });
    expect(props.onUpdate).toHaveBeenCalledWith({ subject: 'X' });
  });

  it('disabilita la generazione dell oggetto mentre è in corso', () => {
    const props = makeProps({ isGeneratingSubject: true, draft: { generateSubject: true } });
    render(<EmailEditor {...props} />);
    expect(screen.getByTitle('Genera oggetto con AI')).toBeDisabled();
  });

  it('apre il contesto, lo modifica e lo svuota', () => {
    const props = makeProps({ draft: { context: 'ctx' } });
    render(<EmailEditor {...props} />);
    fireEvent.click(screen.getByTitle('Apri Contesto'));
    fireEvent.change(screen.getByPlaceholderText(/contesto della conversazione/), {
      target: { value: 'nuovo' },
    });
    expect(props.onUpdate).toHaveBeenCalledWith({ context: 'nuovo' });
    fireEvent.click(screen.getByTitle('Chiudi Contesto'));
    const pasteButtons = screen.getAllByTitle('Incolla da appunti');
    fireEvent.click(pasteButtons[0]);
    expect(props.onPaste).toHaveBeenCalledWith('context');
    fireEvent.click(pasteButtons[1]);
    expect(props.onPaste).toHaveBeenCalledWith('draft');
    const trash = pasteButtons[0].nextElementSibling;
    if (trash) fireEvent.click(trash);
    expect(props.onUpdate).toHaveBeenCalledWith({ context: '' });
  });

  it('apre il selettore file con i pulsanti', () => {
    const { container } = render(<EmailEditor {...makeProps()} />);
    const inputs = getFileInputs(container);
    const clicks = [vi.spyOn(inputs[0], 'click'), vi.spyOn(inputs[1], 'click')];
    for (const button of screen.getAllByTitle('Incolla da PDF o Markdown')) fireEvent.click(button);
    expect(clicks[0]).toHaveBeenCalled();
    expect(clicks[1]).toHaveBeenCalled();
  });

  it('importa un PDF nel contesto vuoto', async () => {
    vi.mocked(extractTextFromPDF).mockResolvedValue('testo pdf');
    const props = makeProps();
    const { container } = render(<EmailEditor {...props} />);
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(getFileInputs(container)[0], { target: { files: [file] } });
    await waitFor(() =>
      expect(props.onUpdate).toHaveBeenCalledWith({ context: '[PDF: doc.pdf]\ntesto pdf' })
    );
  });

  it('accoda un Markdown alla bozza esistente', async () => {
    const props = makeProps({ draft: { draft: 'esistente' } });
    const { container } = render(<EmailEditor {...props} />);
    const file = new File(['# md'], 'note.MD', { type: '' });
    fireEvent.change(getFileInputs(container)[1], { target: { files: [file] } });
    await waitFor(() =>
      expect(props.onUpdate).toHaveBeenCalledWith({ draft: 'esistente\n\n[MD: note.MD]\n# md' })
    );
  });

  it('rifiuta formati non supportati e ignora selezioni vuote', async () => {
    const props = makeProps();
    const { container } = render(<EmailEditor {...props} />);
    const input = getFileInputs(container)[0];
    fireEvent.change(input, { target: { files: [] } });
    const txt = new File(['x'], 'a.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [txt] } });
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/non supportato/))
    );
    expect(props.onUpdate).not.toHaveBeenCalled();
  });

  it('segnala gli errori di estrazione del testo', async () => {
    vi.mocked(extractTextFromPDF).mockRejectedValue(new Error('pdf rotto'));
    const { container } = render(<EmailEditor {...makeProps()} />);
    fireEvent.change(getFileInputs(container)[0], {
      target: { files: [new File(['x'], 'a.pdf', { type: '' })] },
    });
    await waitFor(() =>
      expect(window.alert).toHaveBeenCalledWith('Impossibile estrarre il testo dal file.')
    );
  });
});
