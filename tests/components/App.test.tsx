import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EmailDraft } from '../../src/types';

// Props catturate dai componenti figli finti, indicizzate per nome del componente.
const { captured, fake } = vi.hoisted(() => {
  const captured: Record<string, Record<string, unknown>> = {};
  const fake = (name: string) => (props: Record<string, unknown>) => {
    captured[name] = props;
    return null;
  };
  return { captured, fake };
});

const { appHooks, history, emailLogic, storage } = vi.hoisted(() => ({
  appHooks: {
    drafts: [] as EmailDraft[],
    updateDraft: vi.fn(),
    createDraft: vi.fn(() => 'nuova'),
    deleteDraft: vi.fn(),
    loading: false,
  },
  history: { updateWithHistory: vi.fn(), undo: vi.fn(), canUndo: vi.fn(() => false) },
  emailLogic: {
    isLoading: false,
    isGeneratingSubject: false,
    isModifying: false,
    isWriting: false,
    handleRefine: vi.fn(),
    handleWrite: vi.fn(),
    handleRegenerate: vi.fn(),
    handleGenerateSubject: vi.fn(),
    handleModifyResult: vi.fn(),
    copyToClipboard: vi.fn(),
    copySubjectToClipboard: vi.fn(),
    pasteFromClipboard: vi.fn(),
  },
  storage: { approaching: false },
}));

vi.mock('../../src/hooks/useAppHooks', () => ({ useAppHooks: () => appHooks }));
vi.mock('../../src/hooks/useDraftHistory', () => ({ useDraftHistory: () => history }));
vi.mock('../../src/hooks/useEmailLogic', () => ({ useEmailLogic: () => emailLogic }));
vi.mock('../../src/utils/storage', () => ({
  getLocalStorageSize: () => 0,
  isLocalStorageApproachingLimit: () => storage.approaching,
}));

vi.mock('../../src/components/EmailEditor', () => ({ EmailEditor: fake('EmailEditor') }));
vi.mock('../../src/components/Sidebar', () => ({ Sidebar: fake('Sidebar') }));
vi.mock('../../src/components/SidebarControls', () => ({
  SidebarControls: fake('SidebarControls'),
}));
vi.mock('../../src/components/Header', () => ({ Header: fake('Header') }));
vi.mock('../../src/components/SettingsModal', () => ({ SettingsModal: fake('SettingsModal') }));
vi.mock('../../src/components/ThreadModal', () => ({ ThreadModal: fake('ThreadModal') }));
vi.mock('../../src/components/EmptyState', () => ({ EmptyState: fake('EmptyState') }));
vi.mock('../../src/components/ErrorModal', () => ({ ErrorModal: fake('ErrorModal') }));
vi.mock('../../src/components/DesktopAppToast', () => ({ DesktopAppToast: fake('Toast') }));
vi.mock('../../src/components/DeleteConfirmationModal', () => ({
  DeleteConfirmationModal: fake('DeleteModal'),
}));
vi.mock('../../src/components/ApiKeyModal', () => ({ default: fake('ApiKeyModal') }));
vi.mock('../../src/components/OldDraftsCleanupModal', () => ({ default: fake('CleanupModal') }));
vi.mock('../../src/components/LocalStorageLimitModal', () => ({ default: fake('StorageModal') }));

import App from '../../src/App';

// Invoca una callback catturata dentro act().
const call = (name: string, prop: string, ...args: unknown[]): unknown => {
  const fn = captured[name]?.[prop];
  if (typeof fn !== 'function') throw new Error(`${name}.${prop} non è una funzione`);
  let out: unknown;
  act(() => {
    out = fn(...args);
  });
  return out;
};
const prop = (name: string, key: string) => captured[name]?.[key];

const makeDraft = (id: string, updatedAt = Date.now()): EmailDraft => ({
  id,
  title: id,
  context: 'ctx',
  draft: 'bozza',
  result: '',
  subject: '',
  persona: 'dev',
  tone: 'friendly',
  detail: 'balanced',
  language: 'it',
  structure: '',
  keywords: '',
  generateSubject: false,
  updatedAt,
});

const setMatchMedia = (matches: boolean) => {
  vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const configure = () => localStorage.setItem('sentai_api_key', 'chiave');

describe('App', () => {
  beforeEach(() => {
    appHooks.drafts = [makeDraft('a'), makeDraft('b')];
    appHooks.loading = false;
    Object.assign(emailLogic, { isLoading: false });
    storage.approaching = false;
    vi.stubEnv('VITE_APP', 'web');
    setMatchMedia(false);
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    for (const key of Object.keys(captured)) delete captured[key];
  });

  it('mostra il caricamento', () => {
    appHooks.loading = true;
    render(<App />);
    expect(screen.getByText('Caricamento...')).toBeInTheDocument();
  });

  it('senza bozze mostra la schermata iniziale', () => {
    appHooks.drafts = [];
    render(<App />);
    call('EmptyState', 'onCreate');
    expect(appHooks.createDraft).toHaveBeenCalled();
    call('EmptyState', 'onOpenSettings');
    expect(prop('SettingsModal', 'isOpen')).toBe(true);
  });

  it('senza API key blocca l app e apre le impostazioni', () => {
    render(<App />);
    expect(prop('ApiKeyModal', 'isOpen')).toBe(true);
    call('ApiKeyModal', 'onSettings');
    expect(prop('SettingsModal', 'isOpen')).toBe(true);
    expect(prop('ApiKeyModal', 'isOpen')).toBe(false);
    call('SettingsModal', 'onClose');
    // senza chiave le azioni AI aprono le impostazioni
    expect(call('EmailEditor', 'onRefine')).toBe(false);
    expect(prop('SettingsModal', 'isOpen')).toBe(true);
  });

  it('salva le impostazioni nel localStorage', () => {
    localStorage.setItem('sentai_provider', 'lmstudio');
    render(<App />);
    expect(prop('ApiKeyModal', 'isOpen')).toBe(false);
    call('SettingsModal', 'setApiKey', 'k');
    call('SettingsModal', 'setProvider', 'openai');
    call('SettingsModal', 'onSave');
    expect(localStorage.getItem('sentai_api_key')).toBe('k');
    expect(localStorage.getItem('sentai_provider')).toBe('openai');
    expect(localStorage.getItem('sentai_model')).toBe('gemini-2.0-flash');
  });

  it('inoltra le azioni dell editor quando l AI è configurata', () => {
    configure();
    render(<App />);
    for (const key of ['onRefine', 'onWrite', 'onRegenerate', 'onGenerateSubject']) {
      call('EmailEditor', key);
    }
    expect(emailLogic.handleRefine).toHaveBeenCalled();
    expect(emailLogic.handleWrite).toHaveBeenCalled();
    expect(emailLogic.handleRegenerate).toHaveBeenCalled();
    expect(emailLogic.handleGenerateSubject).toHaveBeenCalled();
    call('EmailEditor', 'onUpdate', { draft: 'x' });
    call('EmailEditor', 'onDiscard');
    call('EmailEditor', 'onUndo');
    expect(history.updateWithHistory).toHaveBeenCalledWith('a', { draft: 'x' });
    expect(history.updateWithHistory).toHaveBeenCalledWith('a', { result: '' });
    expect(history.undo).toHaveBeenCalledWith('a');

    call('EmailEditor', 'onAiError', 'errore');
    expect(prop('ErrorModal', 'message')).toBe('errore');
    call('ErrorModal', 'onClose');
    expect(prop('ErrorModal', 'message')).toBeNull();
  });

  it('gestisce sidebar, controlli e header', () => {
    configure();
    render(<App />);
    call('Sidebar', 'setActiveId', 'b');
    expect(prop('EmailEditor', 'draft')).toMatchObject({ id: 'b' });
    call('Sidebar', 'createDraft');
    expect(appHooks.createDraft).toHaveBeenCalled();

    call('Header', 'toggleSidebar');
    expect(prop('Sidebar', 'isOpen')).toBe(true);
    call('Header', 'onOpenSettings');
    expect(prop('SettingsModal', 'isOpen')).toBe(true);

    fireEvent.click(screen.getByTitle('Mostra i controlli AI'));
    expect(prop('SidebarControls', 'isOpen')).toBe(true);
    call('SidebarControls', 'onUpdate', { tone: 'x' });
    expect(appHooks.updateDraft).toHaveBeenCalledWith('nuova', { tone: 'x' });
    call('SidebarControls', 'onClose');
    expect(prop('SidebarControls', 'isOpen')).toBe(false);
  });

  it('su schermo grande la sidebar resta aperta', () => {
    configure();
    setMatchMedia(true);
    render(<App />);
    call('Sidebar', 'setActiveId', 'b');
    call('Sidebar', 'createDraft');
    expect(prop('Sidebar', 'isOpen')).toBe(true);
  });

  it('durante un elaborazione blocca il cambio bozza', () => {
    configure();
    emailLogic.isLoading = true;
    render(<App />);
    expect(prop('Sidebar', 'isLocked')).toBe(true);
    call('Sidebar', 'setActiveId', 'b');
    call('Sidebar', 'setActiveId', 'a');
    call('Sidebar', 'createDraft');
    expect(appHooks.createDraft).not.toHaveBeenCalled();
    expect(prop('EmailEditor', 'draft')).toMatchObject({ id: 'a' });
  });

  it('elimina una bozza dopo la conferma', () => {
    configure();
    render(<App />);
    call('Sidebar', 'onDelete', 'b');
    expect(prop('DeleteModal', 'isOpen')).toBe(true);
    call('DeleteModal', 'onConfirm');
    expect(appHooks.deleteDraft).toHaveBeenCalledWith('b');

    call('Sidebar', 'onDelete', 'a');
    call('DeleteModal', 'onConfirm');
    expect(appHooks.deleteDraft).toHaveBeenCalledWith('a');
    expect(prop('EmailEditor', 'draft')).toMatchObject({ id: 'b' });

    call('DeleteModal', 'onConfirm');
    expect(appHooks.deleteDraft).toHaveBeenCalledTimes(2);
    call('Sidebar', 'onDelete', 'a');
    call('DeleteModal', 'onClose');
    expect(prop('DeleteModal', 'isOpen')).toBe(false);
  });

  it('se la bozza attiva è l unica eliminata resta senza id', () => {
    configure();
    appHooks.drafts = [makeDraft('a')];
    render(<App />);
    call('Sidebar', 'onDelete', 'a');
    call('DeleteModal', 'onConfirm');
    expect(prop('Sidebar', 'activeId')).toBe('');
  });

  it('continua il thread con la risposta del cliente', async () => {
    configure();
    const readText = vi.fn().mockResolvedValue('dagli appunti');
    Object.defineProperty(navigator, 'clipboard', { value: { readText }, configurable: true });
    appHooks.drafts = [{ ...makeDraft('a'), result: 'raffinata' }, makeDraft('b')];
    render(<App />);
    call('EmailEditor', 'onContinueThread');
    expect(prop('ThreadModal', 'isOpen')).toBe(true);
    await act(async () => {
      const onPaste = prop('ThreadModal', 'onPaste');
      if (typeof onPaste === 'function') onPaste();
    });
    expect(prop('ThreadModal', 'value')).toBe('dagli appunti');
    call('ThreadModal', 'onConfirm');
    expect(history.updateWithHistory).toHaveBeenCalledWith(
      'a',
      expect.objectContaining({ draft: '', result: '' })
    );
    expect(history.updateWithHistory.mock.lastCall?.[1].context).toContain('raffinata');
    expect(prop('ThreadModal', 'isOpen')).toBe(false);

    // senza risultato usa la bozza scritta a mano
    appHooks.drafts = [makeDraft('a')];
    call('ThreadModal', 'onChange', 'ok');
    call('ThreadModal', 'onClose');
  });

  it('propone la pulizia delle bozze scadute e avvisa sullo spazio', () => {
    configure();
    storage.approaching = true;
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    appHooks.drafts = [makeDraft('a', old), makeDraft('b')];
    render(<App />);
    expect(prop('CleanupModal', 'isOpen')).toBe(true);
    expect(prop('CleanupModal', 'expiredCount')).toBe(1);
    expect(prop('StorageModal', 'isOpen')).toBe(true);
    call('CleanupModal', 'onConfirm');
    expect(appHooks.deleteDraft).toHaveBeenCalledWith('a');
    expect(prop('CleanupModal', 'isOpen')).toBe(false);
    call('StorageModal', 'onClose');
    expect(prop('StorageModal', 'isOpen')).toBe(false);
  });

  it('chiude la pulizia senza eliminare e la salta su desktop', () => {
    configure();
    const old = Date.now() - 8 * 24 * 60 * 60 * 1000;
    appHooks.drafts = [makeDraft('a', old)];
    const { unmount } = render(<App />);
    call('CleanupModal', 'onClose');
    expect(appHooks.deleteDraft).not.toHaveBeenCalled();
    unmount();

    vi.stubEnv('VITE_APP', 'desktop');
    render(<App />);
    expect(prop('CleanupModal', 'isOpen')).toBe(false);
  });
});
