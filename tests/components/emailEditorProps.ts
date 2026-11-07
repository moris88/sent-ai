import type { ComponentProps } from 'react';
import { vi } from 'vitest';
import type { EmailEditor } from '../../src/components/EmailEditor';
import type { EmailDraft } from '../../src/types';

export type EmailEditorProps = ComponentProps<typeof EmailEditor>;

// Bozza di base con tutti i campi obbligatori valorizzati.
export const makeDraft = (overrides: Partial<EmailDraft> = {}): EmailDraft => ({
  id: 'draft-1',
  title: 'Titolo',
  context: '',
  draft: '',
  result: '',
  subject: '',
  persona: 'dev',
  tone: 'friendly',
  detail: 'medium',
  language: 'it',
  structure: 'free',
  keywords: '',
  generateSubject: false,
  updatedAt: 0,
  ...overrides,
});

type PropsOverrides = Partial<Omit<EmailEditorProps, 'draft'>> & { draft?: Partial<EmailDraft> };

// Props complete con callback mock; ogni campo è sovrascrivibile.
export const makeProps = (overrides: PropsOverrides = {}): EmailEditorProps => {
  const { draft, ...rest } = overrides;
  return {
    draft: makeDraft(draft),
    isLoading: false,
    isGeneratingSubject: false,
    isModifying: false,
    isWriting: false,
    onUpdate: vi.fn(),
    onRefine: vi.fn(),
    onWrite: vi.fn(),
    onPaste: vi.fn(),
    onContinueThread: vi.fn(),
    onCopyResult: vi.fn(),
    onUndo: vi.fn(),
    canUndo: false,
    onDiscard: vi.fn(),
    onRegenerate: vi.fn(),
    onGenerateSubject: vi.fn(),
    onCopySubject: vi.fn(),
    onModifyResult: vi.fn(),
    checkApiKey: vi.fn(() => true),
    onAiError: vi.fn(),
    ...rest,
  };
};

// jsdom non implementa scrollIntoView: lo stub evita errori negli effetti.
export const stubDom = () => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(console, 'debug').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'alert').mockImplementation(() => {});
};

export const setAiConfig = (provider = 'openai', apiKey = 'key', model = 'gpt') => {
  localStorage.setItem('sentai_provider', provider);
  if (apiKey) localStorage.setItem('sentai_api_key', apiKey);
  localStorage.setItem('sentai_model', model);
};
