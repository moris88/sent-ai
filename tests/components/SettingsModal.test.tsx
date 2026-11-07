import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsModal } from '../../src/components/SettingsModal';

const { getModels, verifyModel } = vi.hoisted(() => ({
  getModels: vi.fn(),
  verifyModel: vi.fn(),
}));
vi.mock('../../src/services/ai', () => ({ getModels, verifyModel }));

interface Overrides {
  isOpen?: boolean;
  provider?: string;
  apiKey?: string;
  modelName?: string;
}

const makeProps = (o: Overrides = {}) => ({
  isOpen: o.isOpen ?? true,
  onClose: vi.fn(),
  apiKey: o.apiKey ?? 'chiave',
  setApiKey: vi.fn(),
  modelName: o.modelName ?? 'modello',
  setModelName: vi.fn(),
  provider: o.provider ?? 'gemini',
  setProvider: vi.fn(),
  lmStudioUrl: 'http://localhost:1234',
  setLmStudioUrl: vi.fn(),
  onAiError: vi.fn(),
  onSave: vi.fn(),
  additionalPrompt: '',
  setAdditionalPrompt: vi.fn(),
});

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_APP', 'web');
    getModels.mockResolvedValue(['m1', 'm2']);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    getModels.mockReset();
    verifyModel.mockReset();
  });

  it('non renderizza nulla se chiuso', () => {
    const { container } = render(<SettingsModal {...makeProps({ isOpen: false })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('carica i modelli disponibili e inoltra le modifiche', async () => {
    const props = makeProps();
    const { container } = render(<SettingsModal {...props} />);
    await waitFor(() => expect(container.querySelectorAll('option[value="m1"]')).toHaveLength(1));
    expect(screen.getByText(/Puoi selezionare un modello/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Provider AI'), { target: { value: 'openai' } });
    fireEvent.change(screen.getByLabelText(/API Key/), { target: { value: 'k2' } });
    fireEvent.change(screen.getByLabelText('Modello'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Prompt Aggiuntivo'), { target: { value: 'p' } });
    fireEvent.change(screen.getByLabelText('Termini da evitare'), { target: { value: 'gratis' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salva Impostazioni' }));

    expect(props.setProvider).toHaveBeenCalledWith('openai');
    expect(props.setApiKey).toHaveBeenCalledWith('k2');
    expect(props.setModelName).toHaveBeenCalledWith('x');
    expect(props.setAdditionalPrompt).toHaveBeenCalledWith('p');
    expect(screen.getByLabelText('Termini da evitare')).toHaveValue('gratis');
    expect(props.onSave).toHaveBeenCalled();
    expect(screen.getByText('Versione desktop')).toBeInTheDocument();
  });

  it('segnala gli errori di caricamento dei modelli', async () => {
    getModels.mockRejectedValueOnce(new Error('no')).mockRejectedValueOnce('strano');
    const props = makeProps();
    const { rerender } = render(<SettingsModal {...props} />);
    await waitFor(() => expect(props.onAiError).toHaveBeenCalledWith('no'));
    rerender(<SettingsModal {...props} apiKey="altra" />);
    await waitFor(() =>
      expect(props.onAiError).toHaveBeenCalledWith('Impossibile caricare i modelli AI.')
    );
    expect(screen.getByText(/Inserisci la API key per caricare/)).toBeInTheDocument();
  });

  it('mostra il campo URL per LM Studio senza caricare modelli', () => {
    vi.stubEnv('VITE_APP', 'desktop');
    const props = makeProps({ provider: 'lmstudio', apiKey: '' });
    render(<SettingsModal {...props} />);
    expect(getModels).not.toHaveBeenCalled();
    expect(screen.getByText('(opzionale)', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Inserisci manualmente il nome/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('URL LM Studio'), { target: { value: 'http://x' } });
    expect(props.setLmStudioUrl).toHaveBeenCalledWith('http://x');
    expect(screen.queryByText('Versione desktop')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verifica modello' })).toBeEnabled();
  });

  it('ignora provider non supportati e chiude', () => {
    const props = makeProps({ provider: 'altro', modelName: ' ' });
    render(<SettingsModal {...props} />);
    expect(getModels).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Verifica modello' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('mostra e nasconde la chiave e incolla dagli appunti', async () => {
    const readText = vi.fn().mockResolvedValueOnce('  incollata ').mockResolvedValueOnce('');
    readText.mockRejectedValueOnce(new Error('negato'));
    Object.defineProperty(navigator, 'clipboard', { value: { readText }, configurable: true });
    const props = makeProps();
    render(<SettingsModal {...props} />);

    fireEvent.click(screen.getByTitle('Mostra API Key'));
    expect(screen.getByLabelText(/API Key/)).toHaveAttribute('type', 'text');
    fireEvent.click(screen.getByTitle('Nascondi API Key'));
    expect(screen.getByLabelText(/API Key/)).toHaveAttribute('type', 'password');

    const paste = screen.getByTitle('Incolla dagli appunti');
    await act(async () => fireEvent.click(paste));
    expect(props.setApiKey).toHaveBeenCalledWith('incollata');
    await act(async () => fireEvent.click(paste));
    await act(async () => fireEvent.click(paste));
    expect(props.setApiKey).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('verifica il modello con esito positivo e negativo', async () => {
    verifyModel
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('non va'))
      .mockRejectedValueOnce('strano');
    render(<SettingsModal {...makeProps()} />);
    const button = screen.getByRole('button', { name: 'Verifica modello' });

    fireEvent.click(button);
    expect(await screen.findByText('Il modello risponde correttamente.')).toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByText('non va')).toBeInTheDocument();
    fireEvent.click(button);
    expect(await screen.findByText('Il modello non risponde.')).toBeInTheDocument();
  });

  it('mostra lo stato di verifica in corso', async () => {
    verifyModel.mockReturnValue(new Promise(() => {}));
    render(<SettingsModal {...makeProps()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Verifica modello' }));
    expect(await screen.findByRole('button', { name: 'Verifica in corso...' })).toBeDisabled();
  });
});
