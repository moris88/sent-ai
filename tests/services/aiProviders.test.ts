import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateSubject,
  generateTitle,
  type Provider,
  querySavedEmails,
  refineEmail,
  reviewDraft,
  reviseEmail,
  verifyModel,
  writeEmail,
} from '../../src/services/ai';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  generateContent: vi.fn(),
  getGenerativeModel: vi.fn(),
}));

vi.mock('openai', () => ({
  default: class {
    chat = { completions: { create: mocks.create } };
  },
}));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel = mocks.getGenerativeModel;
  },
}));

const fetchMock = vi.fn<typeof fetch>();

const openAiReply = (content: string | null) => ({ choices: [{ message: { content } }] });
const geminiReply = (text: string) => ({ response: { text: () => text } });
const lmReply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const base = { apiKey: 'chiave', model: 'modello' };
const refineBase = {
  ...base,
  persona: 'p',
  tone: 't',
  detail: 'd',
  language: 'it',
  structure: 's',
  draft: 'bozza',
};

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  mocks.getGenerativeModel.mockReturnValue({ generateContent: mocks.generateContent });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

const sentBody = (): Record<string, unknown> =>
  JSON.parse(String(fetchMock.mock.calls[0][1]?.body));

describe('refineEmail', () => {
  it('usa OpenAI e restituisce stringa vuota se manca il contenuto', async () => {
    mocks.create.mockResolvedValueOnce(openAiReply('Ciao'));
    expect(await refineEmail({ ...refineBase, provider: 'openai' })).toBe('Ciao');
    mocks.create.mockResolvedValueOnce(openAiReply(null));
    expect(await refineEmail({ ...refineBase, provider: 'openai' })).toBe('');
  });

  it('include parole chiave, contesto e prompt aggiuntivo', async () => {
    mocks.create.mockResolvedValueOnce(openAiReply('ok'));
    await refineEmail({
      ...refineBase,
      provider: 'openai',
      keywords: 'kw',
      context: 'ctx',
      prompt: 'extra',
    });
    const content = String(mocks.create.mock.calls[0][0].messages[0].content);
    expect(content).toContain('<keywords>kw</keywords>');
    expect(content).toContain('<context>ctx</context>');
    expect(content).toContain('<additional_prompt>extra</additional_prompt>');
  });

  it('usa Gemini come predefinito', async () => {
    mocks.generateContent.mockResolvedValueOnce(geminiReply('Gemini'));
    expect(await refineEmail({ ...refineBase, provider: 'gemini' })).toBe('Gemini');
    expect(mocks.getGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'modello' })
    );
  });

  it('usa LM Studio con header di autorizzazione e prompt di sistema', async () => {
    fetchMock.mockResolvedValueOnce(lmReply({ output: [{ type: 'message', content: ' LM ' }] }));
    expect(await refineEmail({ ...refineBase, provider: 'lmstudio' })).toBe('LM');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:1234/api/v1/chat');
    const headers = init?.headers;
    expect(headers instanceof Headers && headers.get('Authorization')).toBe('Bearer chiave');
    expect(sentBody().system_prompt).toBeTruthy();
  });

  it('omette Authorization senza chiave', async () => {
    fetchMock.mockResolvedValueOnce(lmReply({ output: 'testo' }));
    await refineEmail({ ...refineBase, apiKey: '', provider: 'lmstudio' });
    const headers = fetchMock.mock.calls[0][1]?.headers;
    expect(headers instanceof Headers && headers.has('Authorization')).toBe(false);
  });

  it('propaga gli errori HTTP di LM Studio con il testo', async () => {
    fetchMock.mockResolvedValueOnce(new Response('rotto', { status: 500 }));
    await expect(refineEmail({ ...refineBase, provider: 'lmstudio' })).rejects.toThrow(
      "LM Studio ha restituito l'errore 500: rotto"
    );
  });

  it('propaga gli errori HTTP di LM Studio senza testo', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 404 }));
    await expect(refineEmail({ ...refineBase, provider: 'lmstudio' })).rejects.toThrow(
      "LM Studio ha restituito l'errore 404."
    );
  });

  it('gestisce il fallimento della lettura del corpo di errore', async () => {
    const broken = new Response(null, { status: 503 });
    vi.spyOn(broken, 'text').mockRejectedValueOnce(new Error('x'));
    fetchMock.mockResolvedValueOnce(broken);
    await expect(refineEmail({ ...refineBase, provider: 'lmstudio' })).rejects.toThrow(
      "LM Studio ha restituito l'errore 503."
    );
  });

  it('propaga gli errori degli SDK', async () => {
    mocks.create.mockRejectedValueOnce(new Error('quota'));
    await expect(refineEmail({ ...refineBase, provider: 'openai' })).rejects.toThrow('quota');
  });
});

describe('estrazione del contenuto LM Studio', () => {
  it.each([
    [{ output: [{ content: 'primo' }] }, 'primo'],
    [{ output: ['stringa'] }, 'stringa'],
    [{ output: [{ content: 3 }] }, ''],
    [{ choices: [{ message: { content: 'scelta' } }] }, 'scelta'],
    [{ content: 'contenuto' }, 'contenuto'],
    [{ response: 'risposta' }, 'risposta'],
    [{}, ''],
  ])('estrae il testo da %j', async (body, expected) => {
    fetchMock.mockResolvedValueOnce(lmReply(body));
    expect(await generateSubject({ ...refineBase, context: '', provider: 'lmstudio' })).toBe(
      expected
    );
  });
});

const providers: Provider[] = ['openai', 'gemini', 'lmstudio'];

const mockReply = (provider: Provider, text: string) => {
  if (provider === 'openai') mocks.create.mockResolvedValueOnce(openAiReply(text));
  else if (provider === 'gemini') mocks.generateContent.mockResolvedValueOnce(geminiReply(text));
  else fetchMock.mockResolvedValueOnce(lmReply({ output: text }));
};

describe.each(providers)('funzioni per il provider %s', (provider) => {
  it('writeEmail scrive da zero', async () => {
    mockReply(provider, ' email ');
    const res = await writeEmail({
      ...refineBase,
      provider,
      instructions: 'scrivi',
      keywords: 'k',
      context: 'c',
      prompt: 'p',
    });
    expect(res).toBe('email');
  });

  it('querySavedEmails risponde alla domanda', async () => {
    mockReply(provider, ' risposta ');
    expect(await querySavedEmails({ ...base, provider, question: 'chi?', emails: '' })).toBe(
      'risposta'
    );
  });

  it("generateSubject genera l'oggetto", async () => {
    mockReply(provider, ' Oggetto ');
    const subject = await generateSubject({
      ...base,
      provider,
      context: 'c',
      draft: 'd',
      result: 'r',
      language: 'xx',
    });
    expect(subject).toBe('Oggetto');
  });

  it("reviseEmail restituisce la revisione o l'originale se vuota", async () => {
    mockReply(provider, ' rivista ');
    const opts = { ...base, provider, result: 'originale', instructions: 'i', language: 'it' };
    expect(await reviseEmail(opts)).toBe('rivista');
    mockReply(provider, '');
    expect(await reviseEmail(opts)).toBe('originale');
  });

  it('generateTitle genera il titolo', async () => {
    mockReply(provider, ' Titolo ');
    expect(await generateTitle('', '', provider, 'k', 'm')).toBe('Titolo');
  });

  it('reviewDraft restituisce i suggerimenti', async () => {
    mockReply(provider, '- ok');
    expect(await reviewDraft({ ...refineBase, provider, subject: '', context: '' })).toBe('- ok');
  });

  it('verifyModel restituisce la risposta', async () => {
    mockReply(provider, 'ok');
    expect(await verifyModel(provider, 'k', 'm')).toBe('ok');
  });

  it('verifyModel fallisce con risposta vuota', async () => {
    mockReply(provider, '');
    await expect(verifyModel(provider, 'k', 'm')).rejects.toThrow('alcuna risposta');
  });
});

describe('valori predefiniti con risposte vuote', () => {
  it('generateTitle usa "Nuova conversazione" per OpenAI e Gemini', async () => {
    mockReply('openai', '');
    expect(await generateTitle('c', 'd', 'openai', 'k', 'm')).toBe('Nuova conversazione');
    mockReply('gemini', '');
    expect(await generateTitle('c', 'd', 'gemini', 'k', 'm')).toBe('Nuova conversazione');
  });

  it('restituisce stringa vuota con contenuto OpenAI nullo', async () => {
    mocks.create.mockResolvedValue(openAiReply(null));
    const provider: Provider = 'openai';
    expect(await querySavedEmails({ ...base, provider, question: 'q', emails: 'e' })).toBe('');
    expect(
      await generateSubject({ ...base, provider, context: '', draft: '', language: 'it' })
    ).toBe('');
    expect(await writeEmail({ ...refineBase, provider, instructions: 'i' })).toBe('');
    expect(
      await reviseEmail({ ...base, provider, result: 'orig', instructions: 'i', language: 'it' })
    ).toBe('orig');
  });

  it('generateSubject restituisce stringa vuota con Gemini', async () => {
    mockReply('gemini', ' ');
    expect(
      await generateSubject({ ...base, provider: 'gemini', context: '', draft: '', language: 'it' })
    ).toBe('');
  });
});
